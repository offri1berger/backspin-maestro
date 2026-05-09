import type { Socket, Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents } from '@hitster/shared'
import { createRoomService, joinRoomService } from '../services/roomService.js'
import { startGameService } from '../services/gameService.js'

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
        avatar: payload.avatar,
        tokens: 2,
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

socket.on('game:start', async (cb) => {
  try {
    const rooms = [...socket.rooms].filter((r) => r !== socket.id)
    const roomCode = rooms[0]

    if (!roomCode) {
      cb('not_in_room')
      return
    }

    const result = await startGameService(roomCode, socket.id)

    if ('error' in result) {
      cb(result.error)
      return
    }

    io.to(roomCode).emit('game:starting', result.gameState, result.players)

    if (result.song) {
      io.to(roomCode).emit('song:new', result.song)
    }

    cb()
  } catch (err) {
    console.error('game:start error', err)
    socket.emit('error', 'Failed to start game')
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
}