import type { Socket, Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents, PlacementResultPayload } from '@hitster/shared'
import {
  PlacePayloadSchema,
  StealPayloadSchema,
  GuessPayloadSchema,
  DragMovePayloadSchema,
} from '@hitster/shared'
import { validatePlacement } from '../services/placementService.js'
import { nextTurnService, checkWinCondition } from '../services/gameService.js'
import { handleGuessService } from '../services/guessService.js'
import { getRandomSong, markSongAsUsed, getFreshPreviewUrl } from '../services/songService.js'
import { getGameState, setGameState, deleteUsedSongs } from '../lib/gameCache.js'
import {
  getPlayerBySocketId, getSessionPlayer, getSessionRoom, getPlayersByRoomCode,
  getTimeline, addToTimeline, updatePlayerTokens, updateRoomStatus,
} from '../lib/session.js'
import { db } from '../db/database.js'
import { placeLimiter, stealLimiter, skipLimiter, guessLimiter } from '../lib/rateLimit.js'
import { pendingResults, stealTimeouts, resolvedRooms, cleanupRoomState } from '../lib/roomTimeouts.js'
import { parsePayload } from '../lib/validate.js'

const buildGameOverPlayers = async (roomCode: string) => {
  const players = await getPlayersByRoomCode(roomCode)
  return Promise.all(players.map(async (p) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar || undefined,
    tokens: p.tokens,
    isHost: p.isHost,
    turnOrder: p.turnOrder,
    timeline: await getTimeline(p.id),
  })))
}

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>

const STEAL_WINDOW_MS = 5_000
const STEAL_EXTENDED_MS = 10_000
const CARD_REVEAL_MS = 3_000


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
      if (!placeLimiter.allow(socket.id)) { cb('rate_limited'); return }
      const data = parsePayload(PlacePayloadSchema, payload)
      if (!data) { cb('invalid_payload'); return }
      const rooms = [...socket.rooms].filter((r) => r !== socket.id)
      const roomCode = rooms[0]
      if (!roomCode) { cb('not_in_room'); return }

      const player = await getPlayerBySocketId(socket.id)
      if (!player) { cb('player_not_found'); return }

      const result = await validatePlacement(roomCode, player.id, data.position)
      if ('error' in result) { cb(result.error); return }

      const placementPayload: PlacementResultPayload = {
        playerId: player.id,
        correct: result.correct,
        song: result.song,
        correctPosition: result.correctPosition,
      }

      pendingResults.set(roomCode, placementPayload)
      resolvedRooms.delete(roomCode)

      const t = setTimeout(async () => {
        if (resolvedRooms.has(roomCode)) return
        resolvedRooms.add(roomCode)
        stealTimeouts.delete(roomCode)

        io.to(roomCode).emit('placement:result', placementPayload)
        pendingResults.delete(roomCode)

        if (result.correct) {
          const freshRoom = await getSessionRoom(roomCode)
          if (!freshRoom) return
          const won = await checkWinCondition(player.id, freshRoom.songsPerPlayer)
          if (won) {
            await updateRoomStatus(roomCode, 'finished')
            await deleteUsedSongs(roomCode)
            cleanupRoomState(roomCode)
            io.to(roomCode).emit('game:over', player.id, await buildGameOverPlayers(roomCode))
            return
          }
        }

        setTimeout(() => advanceTurn(io, roomCode), CARD_REVEAL_MS)
      }, STEAL_WINDOW_MS)
      stealTimeouts.set(roomCode, t)

      io.to(roomCode).emit('steal:open', player.id)
      cb()
    } catch (err) {
      console.error('card:place error', err)
      cb('server_error')
    }
  })

  socket.on('steal:attempt', async (payload, cb) => {
    try {
      if (!stealLimiter.allow(socket.id)) { cb('rate_limited'); return }
      const data = parsePayload(StealPayloadSchema, payload)
      if (!data) { cb('invalid_payload'); return }
      const { targetPlayerId, position } = data
      const rooms = [...socket.rooms].filter((r) => r !== socket.id)
      const roomCode = rooms[0]
      if (!roomCode) { cb('not_in_room'); return }

      if (resolvedRooms.has(roomCode)) { cb('steal_window_closed'); return }
      resolvedRooms.add(roomCode)

      const timeout = stealTimeouts.get(roomCode)
      if (timeout) { clearTimeout(timeout); stealTimeouts.delete(roomCode) }

      const gameState = await getGameState(roomCode)
      if (!gameState) { cb('game_not_found'); return }
      if (!gameState.currentSongId) { cb('no_current_song'); return }

      const pending = pendingResults.get(roomCode)
      if (!pending) { cb('no_pending_result'); return }

      const stealer = await getPlayerBySocketId(socket.id)
      if (!stealer) { cb('player_not_found'); return }

      const targetPlayer = await getSessionPlayer(targetPlayerId)
      if (!targetPlayer || targetPlayer.roomCode !== roomCode) { cb('target_not_found'); return }
      if (stealer.id === targetPlayerId) { cb('cannot_steal_from_self'); return }
      if (stealer.tokens < 1) { cb('insufficient_tokens'); return }

      const dbSong = await db.selectFrom('songs').selectAll()
        .where('id', '=', gameState.currentSongId).executeTakeFirstOrThrow()

      const song = {
        id: dbSong.id, title: dbSong.title, artist: dbSong.artist,
        year: dbSong.year, previewUrl: dbSong.preview_url, deezerTrackId: dbSong.deezer_id,
      }

      await updatePlayerTokens(stealer.id, stealer.tokens - 1)
      io.to(roomCode).emit('tokens:updated', stealer.id, stealer.tokens - 1)

      let stealCorrect = false

      if (!pending.correct) {
        const targetTimeline = await getTimeline(targetPlayerId)
        const prevOk = !targetTimeline[position - 1] || targetTimeline[position - 1].song.year <= song.year
        const nextOk = !targetTimeline[position] || targetTimeline[position].song.year >= song.year
        stealCorrect = prevOk && nextOk

        if (stealCorrect) {
          await addToTimeline(stealer.id, song)
        }
      }

      await setGameState(roomCode, { ...gameState, phase: 'song_phase' })
      pendingResults.delete(roomCode)

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
          const freshRoom = await getSessionRoom(roomCode)
          if (!freshRoom) return
          const won = await checkWinCondition(stealer.id, freshRoom.songsPerPlayer)
          if (won) {
            await updateRoomStatus(roomCode, 'finished')
            await deleteUsedSongs(roomCode)
            cleanupRoomState(roomCode)
            io.to(roomCode).emit('game:over', stealer.id, await buildGameOverPlayers(roomCode))
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

  socket.on('steal:initiated', async () => {
    if (!stealLimiter.allow(socket.id)) return
    const stealer = await getPlayerBySocketId(socket.id)
    if (!stealer) return
    const stealerId = stealer.id
    const roomCode = stealer.roomCode
    if (!roomCode) return

    if (resolvedRooms.has(roomCode)) return

    const pending = pendingResults.get(roomCode)
    if (!pending) return
    if (pending.playerId === stealerId) return
    if (stealer.tokens < 1) return

    const existing = stealTimeouts.get(roomCode)
    if (existing) { clearTimeout(existing); stealTimeouts.delete(roomCode) }

    const t = setTimeout(async () => {
      if (resolvedRooms.has(roomCode)) return
      resolvedRooms.add(roomCode)
      stealTimeouts.delete(roomCode)

      io.to(roomCode).emit('placement:result', pending)
      pendingResults.delete(roomCode)

      if (pending.correct) {
        const freshRoom = await getSessionRoom(roomCode)
        if (!freshRoom) return
        const won = await checkWinCondition(pending.playerId, freshRoom.songsPerPlayer)
        if (won) {
          await updateRoomStatus(roomCode, 'finished')
          await deleteUsedSongs(roomCode)
          cleanupRoomState(roomCode)
          io.to(roomCode).emit('game:over', pending.playerId, await buildGameOverPlayers(roomCode))
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
      if (!skipLimiter.allow(socket.id)) { cb('rate_limited'); return }
      const rooms = [...socket.rooms].filter((r) => r !== socket.id)
      const roomCode = rooms[0]
      if (!roomCode) { cb('not_in_room'); return }

      const gameState = await getGameState(roomCode)
      if (!gameState) { cb('game_not_found'); return }

      const player = await getPlayerBySocketId(socket.id)
      if (!player) { cb('player_not_found'); return }
      if (player.id !== gameState.currentPlayerId) { cb('not_your_turn'); return }
      if (player.tokens < 1) { cb('insufficient_tokens'); return }

      await updatePlayerTokens(player.id, player.tokens - 1)
      io.to(roomCode).emit('tokens:updated', player.id, player.tokens - 1)

      const song = await getRandomSong(roomCode)
      if (!song) { cb('no_songs_left'); return }

      await markSongAsUsed(roomCode, song.id)
      const freshPreviewUrl = await getFreshPreviewUrl(song.deezer_id)
      await setGameState(roomCode, { ...gameState, currentSongId: song.id, phase: 'song_phase', phaseStartedAt: new Date().toISOString() })

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
      if (!guessLimiter.allow(socket.id)) return
      const data = parsePayload(GuessPayloadSchema, payload)
      if (!data) return
      const rooms = [...socket.rooms].filter((r) => r !== socket.id)
      const roomCode = rooms[0]
      if (!roomCode) return

      const result = await handleGuessService(roomCode, socket.id, data.artist, data.title)
      if ('error' in result) { console.error('guess error:', result.error); return }

      if (result.correct) {
        io.to(roomCode).emit('token:earned', result.playerId, result.tokens)
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

  socket.on('drag:move', (payload) => {
    const data = parsePayload(DragMovePayloadSchema, payload)
    if (!data) return
    const rooms = [...socket.rooms].filter((r) => r !== socket.id)
    const roomCode = rooms[0]
    if (roomCode) socket.to(roomCode).emit('drag:update', data.slot)
  })
}
