import type { Socket, Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents, PlacementResultPayload } from '@hitster/shared'
import {
  PlacePayloadSchema,
  StealPayloadSchema,
  GuessPayloadSchema,
  DragMovePayloadSchema,
} from '@hitster/shared'
import { validatePlacement } from '../services/placementService.js'
import { handleGuessService } from '../services/guessService.js'
import { getRandomSong, markSongAsUsed, getFreshPreviewUrl } from '../services/songService.js'
import { getGameState, setGameState } from '../lib/gameCache.js'
import {
  getPlayerBySocketId, getSessionPlayer,
  getTimeline, addToTimeline, updatePlayerTokens,
} from '../lib/session.js'
import { db } from '../db/database.js'
import { placeLimiter, stealLimiter, skipLimiter, guessLimiter } from '../lib/rateLimit.js'
import {
  openStealWindow, getPending, clearPending,
  tryClaimResolution, isResolved,
} from '../lib/roomTimeouts.js'
import {
  scheduleStealFire, cancelStealFire, scheduleCardReveal,
} from '../lib/jobs.js'
import { config } from '../lib/config.js'
import { parsePayload } from '../lib/validate.js'
import { logger } from '../lib/logger.js'
import { getSocketRoomCode } from '../lib/socketRoom.js'
import { toSong } from '../services/mappers.js'

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>


export const registerGameHandlers = (io: IoServer, socket: IoSocket) => {
  socket.on('card:place', async (payload, cb) => {
    try {
      if (!placeLimiter.allow(socket.id)) { cb('rate_limited'); return }
      const data = parsePayload(PlacePayloadSchema, payload)
      if (!data) { cb('invalid_payload'); return }
      const roomCode = getSocketRoomCode(socket)
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

      await openStealWindow(roomCode, placementPayload)
      await scheduleStealFire({ roomCode, payload: placementPayload }, config.stealWindowMs)

      io.to(roomCode).emit('steal:open', player.id, data.position)
      cb()
    } catch (err) {
      logger.error({ err }, 'card:place handler threw')
      cb('server_error')
    }
  })

  socket.on('steal:attempt', async (payload, cb) => {
    try {
      if (!stealLimiter.allow(socket.id)) { cb('rate_limited'); return }
      const data = parsePayload(StealPayloadSchema, payload)
      if (!data) { cb('invalid_payload'); return }
      const { targetPlayerId, position } = data
      const roomCode = getSocketRoomCode(socket)
      if (!roomCode) { cb('not_in_room'); return }

      const gameState = await getGameState(roomCode)
      if (!gameState) { cb('game_not_found'); return }
      if (!gameState.currentSongId) { cb('no_current_song'); return }

      if (await isResolved(roomCode)) { cb('steal_window_closed'); return }

      const pending = await getPending(roomCode)
      if (!pending) { cb('no_pending_result'); return }

      const stealer = await getPlayerBySocketId(socket.id)
      if (!stealer) { cb('player_not_found'); return }

      const targetPlayer = await getSessionPlayer(targetPlayerId)
      if (!targetPlayer || targetPlayer.roomCode !== roomCode) { cb('target_not_found'); return }
      if (stealer.id === targetPlayerId) { cb('cannot_steal_from_self'); return }
      if (stealer.tokens < 1) { cb('insufficient_tokens'); return }

      if (!(await tryClaimResolution(roomCode))) { cb('steal_window_closed'); return }
      await cancelStealFire(roomCode)

      const dbSong = await db.selectFrom('songs').selectAll()
        .where('id', '=', gameState.currentSongId).executeTakeFirstOrThrow()

      const song = toSong(dbSong)

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
      await clearPending(roomCode)

      io.to(roomCode).emit('steal:result', {
        success: true, stealerId: stealer.id, targetPlayerId,
        correct: stealCorrect,
        targetWasCorrect: pending.correct,
        song: pending.song,
      })
      io.to(roomCode).emit('placement:result', pending)

      cb()

      await scheduleCardReveal({
        roomCode,
        candidateWinnerId: stealCorrect ? stealer.id : undefined,
      }, config.cardRevealMs)
    } catch (err) {
      logger.error({ err }, 'steal:attempt handler threw')
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

    if (await isResolved(roomCode)) return

    const pending = await getPending(roomCode)
    if (!pending) return
    if (pending.playerId === stealerId) return
    if (stealer.tokens < 1) return

    // Replace the in-flight steal-fire job with the extended-delay version.
    await scheduleStealFire({ roomCode, payload: pending }, config.stealExtendedMs)

    io.to(roomCode).emit('steal:extended', stealerId)
  })

  socket.on('song:skip', async (cb) => {
    try {
      if (!skipLimiter.allow(socket.id)) { cb('rate_limited'); return }
      const roomCode = getSocketRoomCode(socket)
      if (!roomCode) { cb('not_in_room'); return }

      const gameState = await getGameState(roomCode)
      if (!gameState) { cb('game_not_found'); return }
      if (gameState.phase !== 'song_phase') { cb('wrong_phase'); return }

      const player = await getPlayerBySocketId(socket.id)
      if (!player) { cb('player_not_found'); return }
      if (player.id !== gameState.currentPlayerId) { cb('not_your_turn'); return }
      if (player.tokens < 1) { cb('insufficient_tokens'); return }

      const song = await getRandomSong(roomCode)
      if (!song) { cb('no_songs_left'); return }

      await updatePlayerTokens(player.id, player.tokens - 1)
      io.to(roomCode).emit('tokens:updated', player.id, player.tokens - 1)

      await markSongAsUsed(roomCode, song.id)
      const freshPreviewUrl = await getFreshPreviewUrl(song.deezer_id)
      await setGameState(roomCode, { ...gameState, currentSongId: song.id, phase: 'song_phase', phaseStartedAt: new Date().toISOString() })

      io.to(roomCode).emit('song:new', toSong(song, freshPreviewUrl))

      cb()
    } catch (err) {
      logger.error({ err }, 'song:skip handler threw')
      cb('server_error')
    }
  })

  socket.on('song:guess', async (payload) => {
    try {
      if (!guessLimiter.allow(socket.id)) return
      const data = parsePayload(GuessPayloadSchema, payload)
      if (!data) return
      const roomCode = getSocketRoomCode(socket)
      if (!roomCode) return

      const result = await handleGuessService(roomCode, socket.id, data.artist, data.title)
      if ('error' in result) { logger.warn({ err: result.error }, 'song:guess service returned error'); return }

      if (result.correct) {
        io.to(roomCode).emit('token:earned', result.playerId, result.tokens)
      }
    } catch (err) {
      logger.error({ err }, 'song:guess handler threw')
    }
  })

  socket.on('audio:play', () => {
    const roomCode = getSocketRoomCode(socket)
    if (roomCode) socket.to(roomCode).emit('audio:play')
  })

  socket.on('audio:pause', () => {
    const roomCode = getSocketRoomCode(socket)
    if (roomCode) socket.to(roomCode).emit('audio:pause')
  })

  socket.on('drag:move', (payload) => {
    const data = parsePayload(DragMovePayloadSchema, payload)
    if (!data) return
    const roomCode = getSocketRoomCode(socket)
    if (roomCode) socket.to(roomCode).emit('drag:update', data.slot)
  })
}
