import type { Socket, Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents } from '@hitster/shared'
import { createRoomService, joinRoomService, rejoinRoomService } from '../services/roomService.js'
import { startGameService } from '../services/gameService.js'
import { cancelDisconnectTimer } from './disconnectHandler.js'

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>

export const registerRoomHandlers = (io: IoServer, socket: IoSocket) => {
  socket.on('room:create', async (payload, cb) => {
    try {
      if (!payload?.hostName?.trim()) { socket.emit('error', 'Invalid payload'); return }
      const result = await createRoomService(payload, socket.id)
      socket.join(result.roomCode)
      cb(result)
    } catch (err) {
      console.error('room:create error', err)
      socket.emit('error', 'Failed to create room')
    }
  })

  socket.on('room:join', async (payload, cb) => {
    try {
      if (!payload?.roomCode?.trim() || !payload?.playerName?.trim()) {
        cb({ success: false, error: 'room_not_found' }); return
      }
      const result = await joinRoomService(payload, socket.id)

      if (!result.success) { cb(result); return }

      socket.join(payload.roomCode)
      socket.to(payload.roomCode).emit('player:joined', {
        id: result.playerId!,
        name: payload.playerName,
        avatar: payload.avatar,
        tokens: 2,
        isHost: false,
        turnOrder: 0,
        timeline: [],
      })
      cb(result)
    } catch (err) {
      console.error('room:join error', err)
      socket.emit('error', 'Failed to join room')
    }
  })

  socket.on('room:rejoin', async (payload, cb) => {
    try {
      if (!payload?.playerId || !payload?.roomCode) {
        cb({ success: false, error: 'player_not_found' }); return
      }
      cancelDisconnectTimer(payload.playerId)
      const result = await rejoinRoomService(payload.playerId, payload.roomCode, socket.id)
      if (result.success) {
        socket.join(payload.roomCode)
        socket.to(payload.roomCode).emit('player:reconnected', payload.playerId)
      }
      cb(result)
    } catch (err) {
      console.error('room:rejoin error', err)
      cb({ success: false, error: 'room_not_found' })
    }
  })

  socket.on('game:start', async (cb) => {
    try {
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
}
