import type { Socket, Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents } from '@hitster/shared'
import { createRoomService, joinRoomService } from '../services/roomService.js'

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>

export const registerRoomHandlers = (io: IoServer, socket: IoSocket) => {
  socket.on('room:create', async (payload, cb) => {
    try {
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
      const result = await joinRoomService(payload, socket.id)

      if (!result.success) {
        cb(result)
        return
      }

      socket.join(payload.roomCode)

      const newPlayer = {
        id: result.playerId!,
        name: payload.playerName,
        tokens: 0,
        isHost: false,
        turnOrder: 0,
        timeline: [],
      }

      socket.to(payload.roomCode).emit('player:joined', newPlayer)
      cb(result)
    } catch (err) {
      console.error('room:join error', err)
      socket.emit('error', 'Failed to join room')
    }
  })
}