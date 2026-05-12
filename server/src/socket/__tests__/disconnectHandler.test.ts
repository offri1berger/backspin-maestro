import { describe, it, expect, beforeEach, afterAll, jest } from '@jest/globals'
import RedisMock from 'ioredis-mock'

const redis = new RedisMock()

jest.unstable_mockModule('../../lib/redis.js', () => ({
  redis,
  pubClient: redis,
  subClient: redis,
}))

const cancelRoomTimers = jest.fn(async () => {})
jest.unstable_mockModule('../../lib/jobs.js', () => ({
  cancelRoomTimers,
  scheduleStealFire: jest.fn(),
  cancelStealFire: jest.fn(),
  scheduleCardReveal: jest.fn(),
  cancelCardReveal: jest.fn(),
  startRoomWorker: jest.fn(),
  closeRoomQueue: jest.fn(),
}))

interface MockSong {
  id: string
  title: string
  artist: string
  year: number
  preview_url: string
  deezer_id: string
}

const songQueue: MockSong[] = []
jest.unstable_mockModule('../../services/songService.js', () => ({
  getRandomSong: jest.fn(async () => songQueue.shift() ?? null),
  markSongAsUsed: jest.fn(async () => {}),
  getFreshPreviewUrl: jest.fn(async () => null),
}))

const { finalizeDisconnect } = await import('../disconnectHandler.js')
const {
  createSessionRoom,
  createSessionPlayer,
  getSessionRoom,
  getSessionPlayer,
  getPlayersByRoomCode,
} = await import('../../lib/session.js')
const { setGameState } = await import('../../lib/gameCache.js')

interface EmitCall {
  room: string
  event: string
  args: unknown[]
}

const makeFakeIo = () => {
  const calls: EmitCall[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const io: any = {
    to: (room: string) => ({
      emit: (event: string, ...args: unknown[]) => {
        calls.push({ room, event, args })
      },
    }),
  }
  return { io, calls }
}

const seedRoom = async (
  status: 'lobby' | 'playing' | 'finished' = 'playing',
  hostId = 'p0',
) => {
  await createSessionRoom('R', { status, hostId, songsPerPlayer: 10, decadeFilter: 'all' })
}

const seedThreePlayers = async () => {
  await createSessionPlayer({ id: 'p0', roomCode: 'R', name: 'Alice', avatar: '', socketId: 's0', tokens: 2, isHost: true, turnOrder: 0 })
  await createSessionPlayer({ id: 'p1', roomCode: 'R', name: 'Bob', avatar: '', socketId: 's1', tokens: 2, isHost: false, turnOrder: 1 })
  await createSessionPlayer({ id: 'p2', roomCode: 'R', name: 'Carol', avatar: '', socketId: 's2', tokens: 2, isHost: false, turnOrder: 2 })
}

const stockSong = (id: string, year = 2000): MockSong => ({
  id, title: 't', artist: 'a', year, preview_url: '', deezer_id: `d-${id}`,
})

beforeEach(async () => {
  await redis.flushall()
  songQueue.length = 0
  cancelRoomTimers.mockClear()
})

afterAll(() => {
  redis.disconnect()
})

describe('finalizeDisconnect', () => {
  describe('no-op cases', () => {
    it('does nothing when the room does not exist', async () => {
      const { io, calls } = makeFakeIo()
      await finalizeDisconnect(io, 'ghost', 'NOPE')
      expect(calls).toEqual([])
    })

    it('does nothing when the room is finished', async () => {
      await seedRoom('finished')
      await seedThreePlayers()
      const { io, calls } = makeFakeIo()
      await finalizeDisconnect(io, 'p0', 'R')
      expect(calls).toEqual([])
    })
  })

  describe('player:left emission', () => {
    it('emits player:left with the disconnecting player id', async () => {
      await seedRoom('lobby')
      await seedThreePlayers()
      const { io, calls } = makeFakeIo()
      await finalizeDisconnect(io, 'p1', 'R')
      const left = calls.find((c) => c.event === 'player:left')
      expect(left).toBeDefined()
      expect(left?.args[0]).toBe('p1')
    })

    it('removes the player from the room afterwards', async () => {
      await seedRoom('lobby')
      await seedThreePlayers()
      const { io } = makeFakeIo()
      await finalizeDisconnect(io, 'p1', 'R')
      expect(await getSessionPlayer('p1')).toBeNull()
      const remaining = await getPlayersByRoomCode('R')
      expect(remaining.map((p) => p.id).sort()).toEqual(['p0', 'p2'])
    })
  })

  describe('turn-skip on disconnect during placement phase (bug fix)', () => {
    beforeEach(async () => {
      await seedRoom('playing')
      await seedThreePlayers()
      songQueue.push(stockSong('next-song'))
    })

    it('cancels in-flight room timers before advancing the turn', async () => {
      await setGameState('R', {
        phase: 'placement',
        currentPlayerId: 'p0',
        currentSongId: 'song-current',
        roundNumber: 1,
        phaseStartedAt: '2026-01-01T00:00:00.000Z',
      })
      const { io } = makeFakeIo()
      await finalizeDisconnect(io, 'p0', 'R')
      expect(cancelRoomTimers).toHaveBeenCalledWith('R')
      expect(cancelRoomTimers).toHaveBeenCalledTimes(1)
    })

    it('emits phase:changed and song:new for the next player', async () => {
      await setGameState('R', {
        phase: 'song_phase',
        currentPlayerId: 'p0',
        currentSongId: 'song-current',
        roundNumber: 1,
        phaseStartedAt: '2026-01-01T00:00:00.000Z',
      })
      const { io, calls } = makeFakeIo()
      await finalizeDisconnect(io, 'p0', 'R')

      const phase = calls.find((c) => c.event === 'phase:changed')
      const song = calls.find((c) => c.event === 'song:new')
      expect(phase).toBeDefined()
      expect(phase?.args[0]).toBe('song_phase')
      expect(phase?.args[2]).toBe('p1')
      expect(song).toBeDefined()
    })

    it('also fires when phase is "placement" (the phase the bug was in)', async () => {
      await setGameState('R', {
        phase: 'placement',
        currentPlayerId: 'p0',
        currentSongId: 'song-current',
        roundNumber: 1,
        phaseStartedAt: '2026-01-01T00:00:00.000Z',
      })
      const { io, calls } = makeFakeIo()
      await finalizeDisconnect(io, 'p0', 'R')
      expect(calls.some((c) => c.event === 'phase:changed')).toBe(true)
    })

    it('does NOT skip turn during steal_window phase (the steal-fire job will handle it)', async () => {
      await setGameState('R', {
        phase: 'steal_window',
        currentPlayerId: 'p0',
        currentSongId: 'song-current',
        roundNumber: 1,
        phaseStartedAt: '2026-01-01T00:00:00.000Z',
      })
      const { io, calls } = makeFakeIo()
      await finalizeDisconnect(io, 'p0', 'R')
      expect(cancelRoomTimers).not.toHaveBeenCalled()
      expect(calls.some((c) => c.event === 'phase:changed')).toBe(false)
    })

    it('does NOT skip turn when a non-active player disconnects', async () => {
      await setGameState('R', {
        phase: 'song_phase',
        currentPlayerId: 'p0',
        currentSongId: 'song-current',
        roundNumber: 1,
        phaseStartedAt: '2026-01-01T00:00:00.000Z',
      })
      const { io, calls } = makeFakeIo()
      await finalizeDisconnect(io, 'p2', 'R')
      expect(cancelRoomTimers).not.toHaveBeenCalled()
      expect(calls.some((c) => c.event === 'phase:changed')).toBe(false)
    })

    it('does NOT skip turn during lobby (game has not started)', async () => {
      await createSessionRoom('LOBBY-R', { status: 'lobby', hostId: 'p0', songsPerPlayer: 10, decadeFilter: 'all' })
      await createSessionPlayer({ id: 'p0', roomCode: 'LOBBY-R', name: 'A', avatar: '', socketId: 's0', tokens: 2, isHost: true, turnOrder: 0 })
      await createSessionPlayer({ id: 'p1', roomCode: 'LOBBY-R', name: 'B', avatar: '', socketId: 's1', tokens: 2, isHost: false, turnOrder: 1 })
      const { io } = makeFakeIo()
      await finalizeDisconnect(io, 'p0', 'LOBBY-R')
      expect(cancelRoomTimers).not.toHaveBeenCalled()
    })
  })

  describe('host transfer', () => {
    it('transfers host to the lowest-turn-order remaining player when host leaves', async () => {
      await seedRoom('lobby')
      await seedThreePlayers()
      const { io, calls } = makeFakeIo()
      await finalizeDisconnect(io, 'p0', 'R') // p0 is host

      // p1 has turnOrder 1 (lowest among remaining)
      const transferred = calls.find((c) => c.event === 'host:transferred')
      expect(transferred?.args[0]).toBe('p1')

      const newHost = await getSessionPlayer('p1')
      expect(newHost?.isHost).toBe(true)

      const room = await getSessionRoom('R')
      expect(room?.hostId).toBe('p1')
    })

    it('does NOT transfer host when a non-host leaves', async () => {
      await seedRoom('lobby')
      await seedThreePlayers()
      const { io, calls } = makeFakeIo()
      await finalizeDisconnect(io, 'p1', 'R') // p1 is not host
      expect(calls.some((c) => c.event === 'host:transferred')).toBe(false)
      expect((await getSessionPlayer('p0'))?.isHost).toBe(true)
    })

    it('does NOT transfer host when host is the last player', async () => {
      await seedRoom('lobby')
      await createSessionPlayer({ id: 'p0', roomCode: 'R', name: 'Solo', avatar: '', socketId: 's0', tokens: 2, isHost: true, turnOrder: 0 })
      const { io, calls } = makeFakeIo()
      await finalizeDisconnect(io, 'p0', 'R')
      expect(calls.some((c) => c.event === 'host:transferred')).toBe(false)
    })
  })
})
