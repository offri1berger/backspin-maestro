import { randomUUID } from 'crypto'
import { generateRoomCode } from '../lib/roomCode.js'
import { createSessionRoom, createSessionPlayer, getSessionRoom, getPlayersByRoomCode, getSessionPlayer, updatePlayerSocketId, getTimeline, resetSessionPlayer, updateRoomStatus, addToTimeline } from '../lib/session.js'
import { getGameState, deleteGameState, deleteUsedSongs } from '../lib/gameCache.js'
import { db } from '../db/database.js'
import { getRandomSong, markSongAsUsed } from './songService.js'
import { toSong, toPlayer, toPlayerWithTimeline } from './mappers.js'
import { config } from '../lib/config.js'
import type { CreateRoomPayload, JoinRoomPayload, JoinRoomResult, RejoinResult, Player, GameState, TimelineEntry } from '@backspin-maestro/shared'

type CreateRoomSuccess = { roomCode: string; playerId: string; timeline: TimelineEntry[] }

const assignStarterSong = async (roomCode: string, playerId: string) => {
  const dbSong = await getRandomSong(roomCode)
  if (!dbSong) return
  const song = toSong(dbSong)
  await markSongAsUsed(roomCode, song.id)
  await addToTimeline(playerId, song)
}

export const createRoomService = async (
  payload: CreateRoomPayload,
  socketId: string
): Promise<CreateRoomSuccess> => {
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
    tokens: config.starterTokens,
    isHost: true,
    turnOrder: 0,
  })

  await assignStarterSong(code, hostId)

  return { roomCode: code, playerId: hostId, timeline: await getTimeline(hostId) }
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
    tokens: config.starterTokens,
    isHost: false,
    turnOrder: 0,
  })

  await assignStarterSong(payload.roomCode, player.id)

  return {
    success: true,
    roomCode: room.code,
    playerId: player.id,
    timeline: await getTimeline(player.id),
    players: existingPlayers.map((p) => toPlayer(p)),
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
  const players: Player[] = await Promise.all(sessionPlayers.map(toPlayerWithTimeline))

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
        if (dbSong) currentSong = toSong(dbSong)
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

export type ResetRoomError = 'room_not_found' | 'not_host'

export const resetRoomService = async (
  roomCode: string,
  socketId: string,
): Promise<{ players: Player[] } | { error: ResetRoomError }> => {
  const room = await getSessionRoom(roomCode)
  if (!room) return { error: 'room_not_found' }

  const sessionPlayers = await getPlayersByRoomCode(roomCode)
  const host = sessionPlayers.find((p) => p.socketId === socketId)
  if (!host?.isHost) return { error: 'not_host' }

  await updateRoomStatus(roomCode, 'lobby')
  await deleteGameState(roomCode)
  await deleteUsedSongs(roomCode)
  await Promise.all(sessionPlayers.map((p) => resetSessionPlayer(p.id)))
  for (const p of sessionPlayers) {
    await assignStarterSong(roomCode, p.id)
  }

  const freshPlayers = await getPlayersByRoomCode(roomCode)
  const players: Player[] = await Promise.all(freshPlayers.map(toPlayerWithTimeline))

  return { players }
}
