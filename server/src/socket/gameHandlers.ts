import type { Socket, Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents, PlacementResultPayload } from '@hitster/shared'
import { validatePlacement } from '../services/placementService.js'
import { nextTurnService, checkWinCondition } from '../services/gameService.js'
import { handleGuessService } from '../services/guessService.js'
import { getRandomSong, markSongAsUsed, getFreshPreviewUrl } from '../services/songService.js'
import { getGameState, setGameState, deleteUsedSongs } from '../lib/gameCache.js'
import { getPlayersByRoomId, updatePlayerTokens } from '../db/queries/players.js'
import { getRoomByCode, updateRoomStatus } from '../db/queries/rooms.js'
import { db } from '../db/database.js'

const getPlayerTimeline = async (playerId: string) => {
  const entries = await db
    .selectFrom('timeline_entries')
    .innerJoin('songs', 'songs.id', 'timeline_entries.song_id')
    .select([
      'timeline_entries.position',
      'songs.id',
      'songs.title',
      'songs.artist',
      'songs.year',
      'songs.preview_url',
      'songs.deezer_id',
    ])
    .where('timeline_entries.player_id', '=', playerId)
    .orderBy('timeline_entries.position', 'asc')
    .execute()

  return entries.map((e) => ({
    position: e.position,
    song: {
      id: e.id,
      title: e.title,
      artist: e.artist,
      year: e.year,
      previewUrl: e.preview_url,
      deezerTrackId: e.deezer_id,
    },
  }))
}

const buildGameOverPlayers = async (freshPlayers: Awaited<ReturnType<typeof getPlayersByRoomId>>) =>
  Promise.all(freshPlayers.map(async (p) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar ?? undefined,
    tokens: p.tokens,
    isHost: p.is_host,
    turnOrder: p.turn_order ?? 0,
    timeline: await getPlayerTimeline(p.id),
  })))

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>

const STEAL_WINDOW_MS = 5_000
const STEAL_EXTENDED_MS = 10_000
const CARD_REVEAL_MS = 3_000

// pending placement results — held until steal window closes
const pendingResults = new Map<string, PlacementResultPayload>()
// pending auto-advance timeouts — cancelled if someone steals
const stealTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
// rooms where the steal window has already been resolved (guards race between timeout + steal)
const resolvedRooms = new Set<string>()

const cleanupRoomState = (roomCode: string) => {
  const t = stealTimeouts.get(roomCode)
  if (t) clearTimeout(t)
  stealTimeouts.delete(roomCode)
  pendingResults.delete(roomCode)
  resolvedRooms.delete(roomCode)
}

const advanceTurn = async (io: IoServer, roomCode: string) => {
  stealTimeouts.delete(roomCode)
  pendingResults.delete(roomCode)
  const next = await nextTurnService(roomCode)
  if ('error' in next) return
  io.to(roomCode).emit('phase:changed', 'song_phase', new Date().toISOString(), next.nextPlayerId)
  io.to(roomCode).emit('song:new', next.song)
}

export const registerGameHandlers = (io: IoServer, socket: IoSocket) => {
  socket.on('card:place', async (payload, cb) => {
    try {
      const rooms = [...socket.rooms].filter((r) => r !== socket.id)
      const roomCode = rooms[0]
      if (!roomCode) { cb('not_in_room'); return }

      const gameState = await getGameState(roomCode)
      if (!gameState) { cb('game_not_found'); return }

      const room = await getRoomByCode(roomCode)
      if (!room) { cb('room_not_found'); return }

      const players = await getPlayersByRoomId(room.id)
      const player = players.find((p) => p.socket_id === socket.id)
      if (!player) { cb('player_not_found'); return }

      const song = await db.selectFrom('songs').selectAll()
        .where('id', '=', gameState.currentSongId!).executeTakeFirstOrThrow()

      const result = await validatePlacement(roomCode, player.id, payload.position)
      if ('error' in result) { cb(result.error); return }

      const placementPayload: PlacementResultPayload = {
        playerId: player.id,
        correct: result.correct,
        song: {
          id: song.id, title: song.title, artist: song.artist,
          year: song.year, previewUrl: song.preview_url, deezerTrackId: song.deezer_id,
        },
        correctPosition: result.correctPosition,
      }

      pendingResults.set(roomCode, placementPayload)
      resolvedRooms.delete(roomCode) // reset from any previous round

      // Register the timeout BEFORE calling cb() — prevents steal:initiated from
      // racing in between cb() and stealTimeouts.set() and losing the cancel handle
      const t = setTimeout(async () => {
        // synchronous guard — must be before any await
        if (resolvedRooms.has(roomCode)) return
        resolvedRooms.add(roomCode)
        stealTimeouts.delete(roomCode)

        io.to(roomCode).emit('placement:result', placementPayload)
        pendingResults.delete(roomCode)

        if (result.correct) {
          const freshRoom = await getRoomByCode(roomCode)
          if (!freshRoom) return
          const won = await checkWinCondition(player.id, freshRoom.id, freshRoom.songs_per_player)
          if (won) {
            const freshPlayers = await getPlayersByRoomId(freshRoom.id)
            await updateRoomStatus(freshRoom.id, 'finished')
            await deleteUsedSongs(freshRoom.id)
            cleanupRoomState(roomCode)
            io.to(roomCode).emit('game:over', player.id, await buildGameOverPlayers(freshPlayers))
            return
          }
        }

        // 3s card reveal before advancing
        setTimeout(() => advanceTurn(io, roomCode), CARD_REVEAL_MS)
      }, STEAL_WINDOW_MS)
      stealTimeouts.set(roomCode, t)

      // signal steal window open and ack AFTER timeout is registered so steal:initiated
      // always has a valid cancel handle to clear
      io.to(roomCode).emit('steal:open', player.id)
      cb()
    } catch (err) {
      console.error('card:place error', err)
      cb('server_error')
    }
  })

  socket.on('steal:attempt', async (payload, cb) => {
    try {
      const { targetPlayerId, position } = payload
      const rooms = [...socket.rooms].filter((r) => r !== socket.id)
      const roomCode = rooms[0]
      if (!roomCode) { cb('not_in_room'); return }

      // synchronous guard — claim the window before any await so the timeout can't race us
      if (resolvedRooms.has(roomCode)) { cb('steal_window_closed'); return }
      resolvedRooms.add(roomCode)

      const timeout = stealTimeouts.get(roomCode)
      if (timeout) { clearTimeout(timeout); stealTimeouts.delete(roomCode) }

      const gameState = await getGameState(roomCode)
      if (!gameState) { cb('game_not_found'); return }
      if (!gameState.currentSongId) { cb('no_current_song'); return }

      const pending = pendingResults.get(roomCode)
      if (!pending) { cb('no_pending_result'); return }

      const room = await getRoomByCode(roomCode)
      if (!room) { cb('room_not_found'); return }

      const players = await getPlayersByRoomId(room.id)
      const stealer = players.find((p) => p.socket_id === socket.id)
      if (!stealer) { cb('player_not_found'); return }
      // verify target is in the same room — prevents cross-room steal if player ID is known
      const targetPlayer = players.find((p) => p.id === targetPlayerId)
      if (!targetPlayer) { cb('target_not_found'); return }
      if (stealer.id === targetPlayerId) { cb('cannot_steal_from_self'); return }
      if (stealer.tokens < 1) { cb('insufficient_tokens'); return }

      const song = await db.selectFrom('songs').selectAll()
        .where('id', '=', gameState.currentSongId).executeTakeFirstOrThrow()

      await updatePlayerTokens(stealer.id, stealer.tokens - 1)
      io.to(roomCode).emit('tokens:updated', stealer.id, stealer.tokens - 1)

      let stealCorrect = false

      if (!pending.correct) {
        // active player was wrong — check if stealer's position is right in target's timeline
        const targetTimeline = await db
          .selectFrom('timeline_entries')
          .innerJoin('songs', 'songs.id', 'timeline_entries.song_id')
          .select(['timeline_entries.position', 'songs.year'])
          .where('timeline_entries.player_id', '=', targetPlayerId)
          .orderBy('timeline_entries.position', 'asc')
          .execute()

        const prevOk = !targetTimeline[position - 1] || targetTimeline[position - 1].year <= song.year
        const nextOk = !targetTimeline[position] || targetTimeline[position].year >= song.year
        stealCorrect = prevOk && nextOk

        if (stealCorrect) {
          try {
            await db.transaction().execute(async (trx) => {
              const stealerTimeline = await trx
                .selectFrom('timeline_entries')
                .innerJoin('songs', 'songs.id', 'timeline_entries.song_id')
                .select(['timeline_entries.id', 'timeline_entries.position', 'songs.year'])
                .where('timeline_entries.player_id', '=', stealer.id)
                .orderBy('timeline_entries.position', 'asc')
                .execute()

              const insertIdx = stealerTimeline.findIndex((t) => t.year > song.year)
              const insertPosition = insertIdx === -1 ? stealerTimeline.length : insertIdx

              for (const entry of stealerTimeline.filter((t) => t.position >= insertPosition).reverse()) {
                await trx.updateTable('timeline_entries')
                  .set({ position: entry.position + 1 })
                  .where('id', '=', entry.id).execute()
              }

              await trx.insertInto('timeline_entries').values({
                player_id: stealer.id,
                song_id: song.id,
                position: insertPosition,
              }).execute()
            })
          } catch (txErr) {
            // Transaction rolled back — do not update cache so it stays consistent with DB
            cb('server_error')
            return
          }
        }
      }

      await setGameState(roomCode, { ...gameState, phase: 'song_phase' })
      pendingResults.delete(roomCode)

      // reveal the steal outcome first, then the original placement result
      io.to(roomCode).emit('steal:result', {
        success: true, stealerId: stealer.id, targetPlayerId,
        correct: stealCorrect,
        targetWasCorrect: pending.correct,
        song: pending.song,
      })
      io.to(roomCode).emit('placement:result', pending)

      cb()

      setTimeout(async () => {
        if (stealCorrect) {
          const freshRoom = await getRoomByCode(roomCode)
          if (!freshRoom) return
          const won = await checkWinCondition(stealer.id, freshRoom.id, freshRoom.songs_per_player)
          if (won) {
            const freshPlayers = await getPlayersByRoomId(freshRoom.id)
            await updateRoomStatus(freshRoom.id, 'finished')
            await deleteUsedSongs(freshRoom.id)
            cleanupRoomState(roomCode)
            io.to(roomCode).emit('game:over', stealer.id, await buildGameOverPlayers(freshPlayers))
            return
          }
        }
        await advanceTurn(io, roomCode)
      }, CARD_REVEAL_MS)
    } catch (err) {
      console.error('steal:attempt error', err)
      cb('server_error')
    }
  })

  socket.on('steal:initiated', (stealerId: string) => {
    const rooms = [...socket.rooms].filter((r) => r !== socket.id)
    const roomCode = rooms[0]
    if (!roomCode) return

    // cancel the running timeout BEFORE checking resolvedRooms —
    // this prevents the 5s timer from firing between now and the guard check
    const existing = stealTimeouts.get(roomCode)
    if (existing) { clearTimeout(existing); stealTimeouts.delete(roomCode) }

    if (resolvedRooms.has(roomCode)) return

    const pending = pendingResults.get(roomCode)
    if (!pending) return

    const t = setTimeout(async () => {
      if (resolvedRooms.has(roomCode)) return
      resolvedRooms.add(roomCode)
      stealTimeouts.delete(roomCode)

      io.to(roomCode).emit('placement:result', pending)
      pendingResults.delete(roomCode)

      if (pending.correct) {
        const freshRoom = await getRoomByCode(roomCode)
        if (!freshRoom) return
        const won = await checkWinCondition(pending.playerId, freshRoom.id, freshRoom.songs_per_player)
        if (won) {
          const freshPlayers = await getPlayersByRoomId(freshRoom.id)
          await updateRoomStatus(freshRoom.id, 'finished')
          await deleteUsedSongs(freshRoom.id)
          cleanupRoomState(roomCode)
          io.to(roomCode).emit('game:over', pending.playerId, await buildGameOverPlayers(freshPlayers))
          return
        }
      }

      setTimeout(() => advanceTurn(io, roomCode), CARD_REVEAL_MS)
    }, STEAL_EXTENDED_MS)
    stealTimeouts.set(roomCode, t)

    io.to(roomCode).emit('steal:extended', stealerId)
  })

  socket.on('song:skip', async (cb) => {
    try {
      const rooms = [...socket.rooms].filter((r) => r !== socket.id)
      const roomCode = rooms[0]
      if (!roomCode) { cb('not_in_room'); return }

      const gameState = await getGameState(roomCode)
      if (!gameState) { cb('game_not_found'); return }

      const room = await getRoomByCode(roomCode)
      if (!room) { cb('room_not_found'); return }

      const players = await getPlayersByRoomId(room.id)
      const player = players.find((p) => p.socket_id === socket.id)
      if (!player) { cb('player_not_found'); return }
      if (player.id !== gameState.currentPlayerId) { cb('not_your_turn'); return }
      if (player.tokens < 1) { cb('insufficient_tokens'); return }

      await updatePlayerTokens(player.id, player.tokens - 1)
      io.to(roomCode).emit('tokens:updated', player.id, player.tokens - 1)

      const song = await getRandomSong(room.id)
      if (!song) { cb('no_songs_left'); return }

      await markSongAsUsed(room.id, song.id)
      const freshPreviewUrl = await getFreshPreviewUrl(song.deezer_id)
      await setGameState(roomCode, { ...gameState, currentSongId: song.id })

      io.to(roomCode).emit('song:new', {
        id: song.id, title: song.title, artist: song.artist,
        year: song.year, previewUrl: freshPreviewUrl ?? song.preview_url,
        deezerTrackId: song.deezer_id,
      })

      cb()
    } catch (err) {
      console.error('song:skip error', err)
      cb('server_error')
    }
  })

  socket.on('song:guess', async (payload) => {
    try {
      const rooms = [...socket.rooms].filter((r) => r !== socket.id)
      const roomCode = rooms[0]
      if (!roomCode) return

      const result = await handleGuessService(roomCode, socket.id, payload.artist, payload.title)
      if ('error' in result) { console.error('guess error:', result.error); return }

      if (result.correct) {
        const player = await db.selectFrom('players').selectAll()
          .where('socket_id', '=', socket.id).executeTakeFirstOrThrow()
        io.to(roomCode).emit('token:earned', player.id, result.tokens)
      }
    } catch (err) {
      console.error('song:guess error', err)
    }
  })

  socket.on('audio:play', () => {
    const rooms = [...socket.rooms].filter((r) => r !== socket.id)
    const roomCode = rooms[0]
    if (roomCode) socket.to(roomCode).emit('audio:play')
  })

  socket.on('audio:pause', () => {
    const rooms = [...socket.rooms].filter((r) => r !== socket.id)
    const roomCode = rooms[0]
    if (roomCode) socket.to(roomCode).emit('audio:pause')
  })

  socket.on('drag:move', ({ slot }) => {
    const rooms = [...socket.rooms].filter((r) => r !== socket.id)
    const roomCode = rooms[0]
    if (roomCode) socket.to(roomCode).emit('drag:update', slot)
  })
}
