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

export const setGameState = async (roomCode: string, state: CachedGameState) =>
  redis.set(gameKey(roomCode), JSON.stringify(state))

export const getGameState = async (roomCode: string): Promise<CachedGameState | null> => {
  const data = await redis.get(gameKey(roomCode))
  return data ? JSON.parse(data) : null
}

export const deleteGameState = async (roomCode: string) =>
  redis.del(gameKey(roomCode))