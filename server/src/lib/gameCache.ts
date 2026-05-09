import { redis } from './redis.js'
import type { GamePhase } from '@hitster/shared'

export interface CachedGameState {
  phase: GamePhase
  currentPlayerId: string
  currentSongId: string | null
  roundNumber: number
  phaseStartedAt: string
}

const gameKey = (roomCode: string) => `game:${roomCode}`
const usedSongsKey = (roomId: string) => `used_songs:${roomId}`

export const setGameState = async (roomCode: string, state: CachedGameState) =>
  redis.set(gameKey(roomCode), JSON.stringify(state))

export const getGameState = async (roomCode: string): Promise<CachedGameState | null> => {
  const data = await redis.get(gameKey(roomCode))
  return data ? JSON.parse(data) : null
}

export const deleteGameState = async (roomCode: string) =>
  redis.del(gameKey(roomCode))

export const addUsedSong = async (roomId: string, songId: string) =>
  redis.sadd(usedSongsKey(roomId), songId)

export const getUsedSongIds = async (roomId: string): Promise<string[]> =>
  redis.smembers(usedSongsKey(roomId))

export const deleteUsedSongs = async (roomId: string) =>
  redis.del(usedSongsKey(roomId))