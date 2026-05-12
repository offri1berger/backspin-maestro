import type { Socket, Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents } from '@hitster/shared'
import {
  CreateRoomPayloadSchema,
  JoinRoomPayloadSchema,
  RejoinPayloadSchema,
  KickPayloadSchema,
} from '@hitster/shared'
import { createRoomService, joinRoomService, rejoinRoomService, resetRoomService } from '../services/roomService.js'
import { startGameService } from '../services/gameService.js'
import { cancelDisconnectTimer, finalizeDisconnect } from './disconnectHandler.js'
import {
  getPlayerBySocketId, getSessionPlayer, getSessionRoom, removeSessionPlayer,
} from '../lib/session.js'
import { roomLimiter } from '../lib/rateLimit.js'
import { parsePayload } from '../lib/validate.js'
import { requireConductor } from '../lib/authz.js'
import { logger } from '../lib/logger.js'
import { getSocketRoomCode } from '../lib/socketRoom.js'

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>

export const registerRoomHandlers = (io: IoServer, socket: IoSocket) => {
  socket.on('room:create', async (payload, cb) => {
    try {
      if (!roomLimiter.allow(socket.id)) { cb({ success: false, error: 'rate_limited' }); return }
      const data = parsePayload(CreateRoomPayloadSchema, payload)
      if (!data) { cb({ success: false, error: 'invalid_payload' }); return }
      const result = await createRoomService(data, socket.id)
      socket.join(result.roomCode)
      cb({ success: true, ...result })
    } catch (err) {
      logger.error({ err }, 'room:create handler threw')
      cb({ success: false, error: 'server_error' })
    }
  })

  socket.on('room:join', async (payload, cb) => {
    try {
      if (!roomLimiter.allow(socket.id)) { cb({ success: false, error: 'rate_limited' }); return }
      const data = parsePayload(JoinRoomPayloadSchema, payload)
      if (!data) { cb({ success: false, error: 'invalid_payload' }); return }
      const result = await joinRoomService(data, socket.id)

      if (!result.success) { cb(result); return }

      socket.join(data.roomCode)
      socket.to(data.roomCode).emit('player:joined', {
        id: result.playerId!,
        name: data.playerName,
        avatar: data.avatar,
        tokens: 2,
        isHost: false,
        turnOrder: 0,
        timeline: result.timeline ?? [],
      })
      cb(result)
    } catch (err) {
      logger.error({ err }, 'room:join handler threw')
      cb({ success: false, error: 'server_error' })
    }
  })

  socket.on('room:rejoin', async (payload, cb) => {
    try {
      const data = parsePayload(RejoinPayloadSchema, payload)
      if (!data) { cb({ success: false, error: 'player_not_found' }); return }
      const { playerId, roomCode } = data
      cancelDisconnectTimer(playerId)
      const result = await rejoinRoomService(playerId, roomCode, socket.id)
      if (result.success) {
        socket.join(roomCode)
        socket.to(roomCode).emit('player:reconnected', playerId)
      }
      cb(result)
    } catch (err) {
      logger.error({ err }, 'room:rejoin handler threw')
      cb({ success: false, error: 'room_not_found' })
    }
  })

  socket.on('game:start', async (cb) => {
    try {
      if (!roomLimiter.allow(socket.id)) { cb('rate_limited'); return }
      const roomCode = getSocketRoomCode(socket)
      if (!roomCode) { cb('not_in_room'); return }

      const result = await startGameService(roomCode, socket.id)
      if ('error' in result) { cb(result.error); return }

      io.to(roomCode).emit('game:starting', result.gameState, result.players)
      if (result.song) io.to(roomCode).emit('song:new', result.song)
      cb()
    } catch (err) {
      logger.error({ err }, 'game:start handler threw')
      cb('server_error')
    }
  })

  socket.on('room:leave', async () => {
    const player = await getPlayerBySocketId(socket.id)
    if (!player) return
    cancelDisconnectTimer(player.id)
    await finalizeDisconnect(io, player.id, player.roomCode)
    socket.leave(player.roomCode)
  })

  socket.on('conductor:kick', async (payload, cb) => {
    try {
      if (!roomLimiter.allow(socket.id)) { cb('rate_limited'); return }
      const data = parsePayload(KickPayloadSchema, payload)
      if (!data) { cb('invalid_payload'); return }

      const auth = await requireConductor(socket.id)
      if (!auth.ok) { cb(auth.error); return }
      if (data.playerId === auth.player.id) { cb('cannot_kick_self'); return }

      const room = await getSessionRoom(auth.roomCode)
      if (!room) { cb('room_not_found'); return }
      // Kicks are a lobby-only social signal. Once the game's started the
      // Conductor has no special powers (see Conductor spec).
      if (room.status !== 'lobby') { cb('not_in_lobby'); return }

      const target = await getSessionPlayer(data.playerId)
      if (!target || target.roomCode !== auth.roomCode) { cb('target_not_found'); return }

      // Emit BEFORE removing — the kicked socket needs the event to navigate
      // out cleanly, and they're still in the room broadcast group right now.
      io.to(auth.roomCode).emit('player:kicked', target.id)

      const targetSocket = io.sockets.sockets.get(target.socketId)
      if (targetSocket) targetSocket.leave(auth.roomCode)
      cancelDisconnectTimer(target.id)
      await removeSessionPlayer(target.id)

      cb()
    } catch (err) {
      logger.error({ err }, 'conductor:kick handler threw')
      cb('server_error')
    }
  })

  socket.on('room:reset', async (cb) => {
    try {
      if (!roomLimiter.allow(socket.id)) { cb('rate_limited'); return }
      const roomCode = getSocketRoomCode(socket)
      if (!roomCode) { cb('not_in_room'); return }

      const result = await resetRoomService(roomCode, socket.id)
      if ('error' in result) { cb(result.error); return }

      io.to(roomCode).emit('game:reset', result.players)
      cb()
    } catch (err) {
      logger.error({ err }, 'room:reset handler threw')
      cb('server_error')
    }
  })
}
