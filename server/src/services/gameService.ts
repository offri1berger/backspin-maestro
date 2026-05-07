import { getPlayersByRoomId, updateTurnOrder } from '../db/queries/players.js'
import { updateRoomStatus, getRoomById } from '../db/queries/rooms.js'
import { setGameState } from '../lib/gameCache.js'
import type { Player } from '@hitster/shared'

export const startGameService = async (
  roomCode: string,
  hostSocketId: string
): Promise<{ players: Player[] } | { error: string }> => {
  const room = await getRoomById(roomCode)
  if (!room) return { error: 'room_not_found' }
  if (room.status !== 'lobby') return { error: 'game_already_started' }

  const dbPlayers = await getPlayersByRoomId(room.id)

  const host = dbPlayers.find((p) => p.socket_id === hostSocketId)
  if (!host?.is_host) return { error: 'not_host' }
  if (dbPlayers.length < 2) return { error: 'not_enough_players' }

  const shuffled = [...dbPlayers].sort(() => Math.random() - 0.5)

  await Promise.all(shuffled.map((p, i) => updateTurnOrder(p.id, i)))

  await updateRoomStatus(room.id, 'playing')

  const firstPlayer = shuffled[0]

  await setGameState(roomCode, {
    phase: 'song_phase',
    currentPlayerId: firstPlayer.id,
    currentSongId: null,
    roundNumber: 1,
    phaseStartedAt: new Date().toISOString(),
  })

  const players: Player[] = shuffled.map((p, i) => ({
    id: p.id,
    name: p.name,
    tokens: p.tokens,
    isHost: p.is_host,
    turnOrder: i,
    timeline: [],
  }))

  return { players }
}