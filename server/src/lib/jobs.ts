import { Queue, Worker, type Job } from 'bullmq'
import IORedis from 'ioredis'
import type { Server } from 'socket.io'
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  PlacementResultPayload,
} from '@hitster/shared'
import {
  tryClaimResolution,
  clearPending,
  cleanupRoomState,
} from './roomTimeouts.js'
import {
  getSessionRoom,
  updateRoomStatus,
  getPlayersByRoomCode,
  getTimeline,
} from './session.js'
import { checkWinCondition, nextTurnService } from '../services/gameService.js'
import { deleteUsedSongs } from './gameCache.js'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'
const QUEUE_NAME = 'room-jobs'

export const CARD_REVEAL_MS = 3_000

export interface StealFireData {
  roomCode: string
  payload: PlacementResultPayload
}

export interface CardRevealData {
  roomCode: string
  candidateWinnerId?: string
}

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>

let bullConnection: IORedis | null = null
let queue: Queue | null = null
let worker: Worker | null = null

const getConnection = (): IORedis => {
  if (!bullConnection) {
    // BullMQ requires `maxRetriesPerRequest: null` for the blocking connection
    // used by Worker. Use a dedicated client distinct from the app's main redis.
    bullConnection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null })
  }
  return bullConnection
}

const getQueue = (): Queue => {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, { connection: getConnection() })
  }
  return queue
}

// BullMQ disallows `:` in custom job IDs.
const stealFireJobId = (roomCode: string) => `steal-fire_${roomCode}`
const cardRevealJobId = (roomCode: string) => `card-reveal_${roomCode}`

const replaceDelayed = async (
  q: Queue,
  jobId: string,
  name: 'steal:fire' | 'card-reveal',
  data: StealFireData | CardRevealData,
  delayMs: number,
) => {
  const existing = await q.getJob(jobId)
  if (existing) {
    await existing.remove().catch(() => undefined)
  }
  await q.add(name, data, {
    delay: delayMs,
    jobId,
    removeOnComplete: true,
    removeOnFail: 100,
  })
}

export const scheduleStealFire = async (data: StealFireData, delayMs: number): Promise<void> => {
  await replaceDelayed(getQueue(), stealFireJobId(data.roomCode), 'steal:fire', data, delayMs)
}

export const cancelStealFire = async (roomCode: string): Promise<void> => {
  const job = await getQueue().getJob(stealFireJobId(roomCode))
  if (job) await job.remove().catch(() => undefined)
}

export const scheduleCardReveal = async (data: CardRevealData, delayMs: number): Promise<void> => {
  await replaceDelayed(getQueue(), cardRevealJobId(data.roomCode), 'card-reveal', data, delayMs)
}

export const cancelCardReveal = async (roomCode: string): Promise<void> => {
  const job = await getQueue().getJob(cardRevealJobId(roomCode))
  if (job) await job.remove().catch(() => undefined)
}

// Cancel any in-flight steal/reveal jobs for a room and mark the room resolved
// so any worker that already picked up a job bails before mutating state.
export const cancelRoomTimers = async (roomCode: string): Promise<void> => {
  await Promise.all([cancelStealFire(roomCode), cancelCardReveal(roomCode)])
  await tryClaimResolution(roomCode)
}

const buildGameOverPlayers = async (roomCode: string) => {
  const players = await getPlayersByRoomCode(roomCode)
  return Promise.all(
    players.map(async (p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar || undefined,
      tokens: p.tokens,
      isHost: p.isHost,
      turnOrder: p.turnOrder,
      timeline: await getTimeline(p.id),
    })),
  )
}

const finishGame = async (io: IoServer, roomCode: string, winnerId: string) => {
  await updateRoomStatus(roomCode, 'finished')
  await deleteUsedSongs(roomCode)
  await cleanupRoomState(roomCode)
  io.to(roomCode).emit('game:over', winnerId, await buildGameOverPlayers(roomCode))
}

const processStealFire = async (io: IoServer, data: StealFireData): Promise<void> => {
  const { roomCode, payload } = data
  if (!(await tryClaimResolution(roomCode))) return

  io.to(roomCode).emit('placement:result', payload)
  await clearPending(roomCode)

  if (payload.correct) {
    const room = await getSessionRoom(roomCode)
    if (room) {
      const won = await checkWinCondition(payload.playerId, room.songsPerPlayer)
      if (won) {
        await finishGame(io, roomCode, payload.playerId)
        return
      }
    }
  }

  await scheduleCardReveal({ roomCode }, CARD_REVEAL_MS)
}

const processCardReveal = async (io: IoServer, data: CardRevealData): Promise<void> => {
  const { roomCode, candidateWinnerId } = data
  if (candidateWinnerId) {
    const room = await getSessionRoom(roomCode)
    if (room) {
      const won = await checkWinCondition(candidateWinnerId, room.songsPerPlayer)
      if (won) {
        await finishGame(io, roomCode, candidateWinnerId)
        return
      }
    }
  }
  await clearPending(roomCode)
  const next = await nextTurnService(roomCode)
  if ('error' in next) return
  io.to(roomCode).emit('phase:changed', 'song_phase', new Date().toISOString(), next.nextPlayerId)
  io.to(roomCode).emit('song:new', next.song)
}

export const startRoomWorker = (io: IoServer): Worker => {
  if (worker) return worker

  worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      if (job.name === 'steal:fire') {
        await processStealFire(io, job.data as StealFireData)
      } else if (job.name === 'card-reveal') {
        await processCardReveal(io, job.data as CardRevealData)
      }
    },
    { connection: getConnection() },
  )

  worker.on('failed', (job, err) => {
    console.error('room-jobs worker job failed', { name: job?.name, id: job?.id, err })
  })

  return worker
}

export const closeRoomQueue = async (): Promise<void> => {
  await Promise.allSettled([worker?.close(), queue?.close()])
  worker = null
  queue = null
  if (bullConnection) {
    await bullConnection.quit().catch(() => undefined)
    bullConnection = null
  }
}
