import type { PlacementResultPayload } from '@hitster/shared'
import { redis } from './redis.js'
import { logger } from './logger.js'

const PENDING_TTL_SECONDS = 60
const RESOLVED_TTL_SECONDS = 60

const pendingKey = (roomCode: string) => `pending:${roomCode}`
const resolvedKey = (roomCode: string) => `resolved:${roomCode}`

export const setPending = async (
  roomCode: string,
  payload: PlacementResultPayload,
): Promise<void> => {
  await redis.set(pendingKey(roomCode), JSON.stringify(payload), 'EX', PENDING_TTL_SECONDS)
}

// Open the steal window atomically: clear the resolution lock from any prior
// round and write the pending payload in a single round-trip so there is no
// gap where the room appears resolved but a fresh pending exists (or vice versa).
export const openStealWindow = async (
  roomCode: string,
  payload: PlacementResultPayload,
): Promise<void> => {
  await redis
    .multi()
    .del(resolvedKey(roomCode))
    .set(pendingKey(roomCode), JSON.stringify(payload), 'EX', PENDING_TTL_SECONDS)
    .exec()
}

export const getPending = async (
  roomCode: string,
): Promise<PlacementResultPayload | null> => {
  const data = await redis.get(pendingKey(roomCode))
  if (!data) return null
  try {
    return JSON.parse(data) as PlacementResultPayload
  } catch (err) {
    logger.error({ err, roomCode }, 'getPending: corrupt redis payload, dropping')
    await redis.del(pendingKey(roomCode))
    return null
  }
}

export const clearPending = async (roomCode: string): Promise<void> => {
  await redis.del(pendingKey(roomCode))
}

// Atomically claim resolution for a room. Returns true only for the first caller.
export const tryClaimResolution = async (roomCode: string): Promise<boolean> => {
  const result = await redis.set(
    resolvedKey(roomCode),
    '1',
    'EX',
    RESOLVED_TTL_SECONDS,
    'NX',
  )
  return result === 'OK'
}

export const isResolved = async (roomCode: string): Promise<boolean> => {
  return (await redis.exists(resolvedKey(roomCode))) === 1
}

export const clearResolved = async (roomCode: string): Promise<void> => {
  await redis.del(resolvedKey(roomCode))
}

// Timers live in BullMQ (see ./jobs.ts). This module only owns the Redis-backed
// pending payload and the atomic resolution lock.
export const cleanupRoomState = async (roomCode: string): Promise<void> => {
  await Promise.all([clearPending(roomCode), clearResolved(roomCode)])
}
