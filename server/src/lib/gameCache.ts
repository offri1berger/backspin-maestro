import { redis } from './redis.js'
import { safeJsonParse } from './safeJson.js'
import type { GamePhase } from '@hitster/shared'

export interface CachedGameState {
  phase: GamePhase
  currentPlayerId: string
  currentSongId: string | null
  roundNumber: number
  phaseStartedAt: string
}

const GAME_TTL_SECONDS = 7_200 // 2 hours — fallback expiry if cleanup never fires

const gameKey = (roomCode: string) => `game:${roomCode}`
const usedSongsKey = (roomCode: string) => `used_songs:${roomCode}`

export const setGameState = async (roomCode: string, state: CachedGameState) =>
  redis.set(gameKey(roomCode), JSON.stringify(state), 'EX', GAME_TTL_SECONDS)

export const getGameState = async (roomCode: string): Promise<CachedGameState | null> => {
  const data = await redis.get(gameKey(roomCode))
  if (!data) return null
  const parsed = safeJsonParse<CachedGameState>(data, `gameState:${roomCode}`)
  if (!parsed) await redis.del(gameKey(roomCode))
  return parsed
}

export const deleteGameState = async (roomCode: string) =>
  redis.del(gameKey(roomCode))

export const addUsedSong = async (roomCode: string, songId: string) => {
  const key = usedSongsKey(roomCode)
  await redis.sadd(key, songId)
  await redis.expire(key, GAME_TTL_SECONDS)
}

export const getUsedSongIds = async (roomCode: string): Promise<string[]> =>
  redis.smembers(usedSongsKey(roomCode))

export const deleteUsedSongs = async (roomCode: string) =>
  redis.del(usedSongsKey(roomCode))