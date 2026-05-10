import type { Socket, Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents } from '@hitster/shared'
import {
  CreateRoomPayloadSchema,
  JoinRoomPayloadSchema,
  RejoinPayloadSchema,
} from '@hitster/shared'
import { createRoomService, joinRoomService, rejoinRoomService, resetRoomService } from '../services/roomService.js'
import { startGameService } from '../services/gameService.js'
import { cancelDisconnectTimer, finalizeDisconnect } from './disconnectHandler.js'
import { getPlayerBySocketId } from '../lib/session.js'
import { roomLimiter } from '../lib/rateLimit.js'
import { parsePayload } from '../lib/validate.js'

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>

export const registerRoomHandlers = (io: IoServer, socket: IoSocket) => {
  socket.on('room:create', async (payload, cb) => {
    try {
      if (!roomLimiter.allow(socket.id)) { socket.emit('error', 'Too many requests'); return }
      const data = parsePayload(CreateRoomPayloadSchema, payload)
      if (!data) { socket.emit('error', 'Invalid payload'); return }
      const result = await createRoomService(data, socket.id)
      socket.join(result.roomCode)
      cb(result)
    } catch (err) {
      console.error('room:create error', err)
      socket.emit('error', 'Failed to create room')
    }
  })

  socket.on('room:join', async (payload, cb) => {
    try {
      if (!roomLimiter.allow(socket.id)) { cb({ success: false, error: 'room_not_found' }); return }
      const data = parsePayload(JoinRoomPayloadSchema, payload)
      if (!data) { cb({ success: false, error: 'room_not_found' }); return }
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
      console.error('room:join error', err)
      socket.emit('error', 'Failed to join room')
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
      console.error('room:rejoin error', err)
      cb({ success: false, error: 'room_not_found' })
    }
  })

  socket.on('game:start', async (cb) => {
    try {
      if (!roomLimiter.allow(socket.id)) { cb('rate_limited'); return }
      const rooms = [...socket.rooms].filter((r) => r !== socket.id)
      const roomCode = rooms[0]
      if (!roomCode) { cb('not_in_room'); return }

      const result = await startGameService(roomCode, socket.id)
      if ('error' in result) { cb(result.error); return }

      io.to(roomCode).emit('game:starting', result.gameState, result.players)
      if (result.song) io.to(roomCode).emit('song:new', result.song)
      cb()
    } catch (err) {
      console.error('game:start error', err)
      socket.emit('error', 'Failed to start game')
    }
  })

  socket.on('room:leave', async () => {
    const player = await getPlayerBySocketId(socket.id)
    if (!player) return
    cancelDisconnectTimer(player.id)
    await finalizeDisconnect(io, player.id, player.roomCode)
    socket.leave(player.roomCode)
  })

  socket.on('room:reset', async (cb) => {
    try {
      if (!roomLimiter.allow(socket.id)) { cb('rate_limited'); return }
      const rooms = [...socket.rooms].filter((r) => r !== socket.id)
      const roomCode = rooms[0]
      if (!roomCode) { cb('not_in_room'); return }

      const result = await resetRoomService(roomCode, socket.id)
      if ('error' in result) { cb(result.error); return }

      io.to(roomCode).emit('game:reset', result.players)
      cb()
    } catch (err) {
      console.error('room:reset error', err)
      cb('server_error')
    }
  })
}
