import { generateRoomCode } from '../lib/roomCode.js'
import { createRoom, getRoomById, updateRoomHost } from '../db/queries/rooms.js'
import { createPlayer, getPlayersByRoomId } from '../db/queries/players.js'
import type { CreateRoomPayload, JoinRoomPayload, JoinRoomResult, CreateRoomResult, Decade } from '@hitster/shared'

export const createRoomService = async (
  payload: CreateRoomPayload,
  socketId: string
): Promise<CreateRoomResult> => {
  const code = generateRoomCode()

  const room = await createRoom({
    code,
    status: 'lobby',
    songs_per_player: payload.settings.songsPerPlayer,
    decade_filter: payload.settings.decadeFilter,
  })

  const player = await createPlayer({
    room_id: room.id,
    name: payload.hostName,
    socket_id: socketId,
    is_host: true,
    tokens: 0,
  })

  await updateRoomHost(room.id, player.id)

  return { roomCode: code, playerId: player.id }
}

export const joinRoomService = async (
  payload: JoinRoomPayload,
  socketId: string
): Promise<JoinRoomResult> => {
  const room = await getRoomById(payload.roomCode)

  if (!room) return { success: false, error: 'room_not_found' }
  if (room.status !== 'lobby') return { success: false, error: 'game_already_started' }

  const existingPlayers = await getPlayersByRoomId(room.id)
  if (existingPlayers.length >= 6) return { success: false, error: 'room_full' }

  const player = await createPlayer({
    room_id: room.id,
    name: payload.playerName,
    socket_id: socketId,
    is_host: false,
    tokens: 0,
  })

  return {
    success: true,
    roomCode: room.code,
    playerId: player.id,
    players: existingPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      tokens: p.tokens,
      isHost: p.is_host,
      turnOrder: p.turn_order ?? 0,
      timeline: [],
    })),
    settings: {
      songsPerPlayer: room.songs_per_player,
      decadeFilter: room.decade_filter as Decade,
    },
  }
}