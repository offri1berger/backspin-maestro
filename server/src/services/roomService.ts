import { randomUUID } from 'crypto'
import { generateRoomCode } from '../lib/roomCode.js'
import { createSessionRoom, createSessionPlayer, getSessionRoom, getPlayersByRoomCode } from '../lib/session.js'
import type { CreateRoomPayload, JoinRoomPayload, JoinRoomResult, CreateRoomResult } from '@hitster/shared'

export const createRoomService = async (
  payload: CreateRoomPayload,
  socketId: string
): Promise<CreateRoomResult> => {
  const code = await generateRoomCode()
  const hostId = randomUUID()

  await createSessionRoom(code, {
    status: 'lobby',
    hostId,
    songsPerPlayer: payload.settings.songsPerPlayer,
    decadeFilter: payload.settings.decadeFilter,
  })

  await createSessionPlayer({
    id: hostId,
    roomCode: code,
    name: payload.hostName,
    avatar: payload.avatar ?? '',
    socketId,
    tokens: 2,
    isHost: true,
    turnOrder: 0,
  })

  return { roomCode: code, playerId: hostId }
}

export const joinRoomService = async (
  payload: JoinRoomPayload,
  socketId: string
): Promise<JoinRoomResult> => {
  const room = await getSessionRoom(payload.roomCode)

  if (!room) return { success: false, error: 'room_not_found' }
  if (room.status !== 'lobby') return { success: false, error: 'game_already_started' }

  const existingPlayers = await getPlayersByRoomCode(payload.roomCode)
  if (existingPlayers.length >= 6) return { success: false, error: 'room_full' }

  const player = await createSessionPlayer({
    roomCode: payload.roomCode,
    name: payload.playerName,
    avatar: payload.avatar ?? '',
    socketId,
    tokens: 2,
    isHost: false,
    turnOrder: 0,
  })

  return {
    success: true,
    roomCode: room.code,
    playerId: player.id,
    players: existingPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar || undefined,
      tokens: p.tokens,
      isHost: p.isHost,
      turnOrder: p.turnOrder,
      timeline: [],
    })),
    settings: {
      songsPerPlayer: room.songsPerPlayer,
      decadeFilter: room.decadeFilter,
    },
  }
}
