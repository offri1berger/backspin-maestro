import type { Server, Socket } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents } from '@hitster/shared'
import {
  getPlayerBySocketId, getSessionRoom, getPlayersByRoomCode,
  removeSessionPlayer, transferHost,
} from '../lib/session.js'
import { getGameState } from '../lib/gameCache.js'
import { nextTurnService } from '../services/gameService.js'

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>

const RECONNECT_GRACE_MS = 30_000

const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>()

export const cancelDisconnectTimer = (playerId: string) => {
  const t = disconnectTimers.get(playerId)
  if (t) { clearTimeout(t); disconnectTimers.delete(playerId) }
}

const finalizeDisconnect = async (io: IoServer, playerId: string, roomCode: string) => {
  const room = await getSessionRoom(roomCode)
  if (!room || room.status === 'finished') return

  const players = await getPlayersByRoomCode(roomCode)
  const leavingPlayer = players.find((p) => p.id === playerId)
  const remaining = players.filter((p) => p.id !== playerId)

  // If it's their turn and the steal window hasn't opened yet, skip to next player
  if (room.status === 'playing') {
    const gameState = await getGameState(roomCode)
    if (gameState?.currentPlayerId === playerId && gameState.phase === 'song_phase') {
      const next = await nextTurnService(roomCode)
      if (!('error' in next)) {
        io.to(roomCode).emit('phase:changed', 'song_phase', new Date().toISOString(), next.nextPlayerId)
        io.to(roomCode).emit('song:new', next.song)
      }
    }
  }

  // Transfer host to next player (by turn order) if needed
  if (leavingPlayer?.isHost && remaining.length > 0) {
    const newHost = remaining.sort((a, b) => a.turnOrder - b.turnOrder)[0]
    await transferHost(roomCode, playerId, newHost.id)
    io.to(roomCode).emit('host:transferred', newHost.id)
  }

  await removeSessionPlayer(playerId)
  io.to(roomCode).emit('player:left', playerId)
}

export const handleDisconnect = async (io: IoServer, socket: IoSocket) => {
  const player = await getPlayerBySocketId(socket.id)
  if (!player) return

  const roomCode = player.roomCode
  io.to(roomCode).emit('player:disconnected', player.id)

  const t = setTimeout(() => {
    disconnectTimers.delete(player.id)
    finalizeDisconnect(io, player.id, roomCode).catch((err) =>
      console.error('finalizeDisconnect error', err)
    )
  }, RECONNECT_GRACE_MS)

  disconnectTimers.set(player.id, t)
}
