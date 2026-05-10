import { randomUUID } from 'crypto'
import { generateRoomCode } from '../lib/roomCode.js'
import { createSessionRoom, createSessionPlayer, getSessionRoom, getPlayersByRoomCode, getSessionPlayer, updatePlayerSocketId, getTimeline } from '../lib/session.js'
import { getGameState } from '../lib/gameCache.js'
import { db } from '../db/database.js'
import type { CreateRoomPayload, JoinRoomPayload, JoinRoomResult, CreateRoomResult, RejoinResult, Player, GameState } from '@hitster/shared'

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

export const rejoinRoomService = async (
  playerId: string,
  roomCode: string,
  socketId: string,
): Promise<RejoinResult> => {
  const room = await getSessionRoom(roomCode)
  if (!room) return { success: false, error: 'room_not_found' }

  const sessionPlayer = await getSessionPlayer(playerId)
  if (!sessionPlayer || sessionPlayer.roomCode !== roomCode) {
    return { success: false, error: 'player_not_found' }
  }

  await updatePlayerSocketId(playerId, socketId)

  const sessionPlayers = await getPlayersByRoomCode(roomCode)
  const players: Player[] = await Promise.all(
    sessionPlayers.map(async (p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar || undefined,
      tokens: p.tokens,
      isHost: p.isHost,
      turnOrder: p.turnOrder,
      timeline: await getTimeline(p.id),
    }))
  )

  let gameState: GameState | null = null
  if (room.status === 'playing') {
    const cached = await getGameState(roomCode)
    if (cached) {
      let currentSong = null
      if (cached.currentSongId) {
        const dbSong = await db
          .selectFrom('songs')
          .selectAll()
          .where('id', '=', cached.currentSongId)
          .executeTakeFirst()
        if (dbSong) {
          currentSong = {
            id: dbSong.id,
            title: dbSong.title,
            artist: dbSong.artist,
            year: dbSong.year,
            previewUrl: dbSong.preview_url,
            deezerTrackId: dbSong.deezer_id,
          }
        }
      }
      gameState = {
        phase: cached.phase,
        currentPlayerId: cached.currentPlayerId,
        currentSong,
        roundNumber: cached.roundNumber,
        phaseStartedAt: cached.phaseStartedAt,
      }
    }
  }

  return {
    success: true,
    roomStatus: room.status,
    players,
    settings: { songsPerPlayer: room.songsPerPlayer, decadeFilter: room.decadeFilter },
    gameState,
  }
}
