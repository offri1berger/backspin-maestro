import { describe, it, expect, beforeEach, afterAll, jest } from '@jest/globals'
import RedisMock from 'ioredis-mock'

const redis = new RedisMock()

jest.unstable_mockModule('../../lib/redis.js', () => ({
  redis,
  pubClient: redis,
  subClient: redis,
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

jest.unstable_mockModule('../songService.js', () => ({
  getRandomSong: jest.fn(async () => songQueue.shift() ?? null),
  markSongAsUsed: jest.fn(async () => {}),
  getFreshPreviewUrl: jest.fn(async () => null),
}))

const { startGameService, nextTurnService, checkWinCondition } = await import('../gameService.js')
const {
  createSessionRoom,
  createSessionPlayer,
  getSessionRoom,
  addToTimeline,
} = await import('../../lib/session.js')
const { getGameState, setGameState } = await import('../../lib/gameCache.js')

const seedSong = (id: string, year = 2000): MockSong => ({
  id, title: `t-${id}`, artist: `a-${id}`, year, preview_url: '', deezer_id: `d-${id}`,
})

const seedRoom = async (code: string, hostId: string, status: 'lobby' | 'playing' = 'lobby') => {
  await createSessionRoom(code, { status, hostId, songsPerPlayer: 10, decadeFilter: 'all' })
}

const seedPlayers = async (code: string, n: number, hostSocketId = 's-host') => {
  for (let i = 0; i < n; i++) {
    await createSessionPlayer({
      id: `p${i}`,
      roomCode: code,
      name: `Player ${i}`,
      avatar: '',
      socketId: i === 0 ? hostSocketId : `s${i}`,
      tokens: 2,
      isHost: i === 0,
      turnOrder: 0,
    })
  }
}

beforeEach(async () => {
  await redis.flushall()
  songQueue.length = 0
})

afterAll(() => {
  redis.disconnect()
})

describe('startGameService', () => {
  describe('error paths', () => {
    it('rejects when room does not exist', async () => {
      const result = await startGameService('NOPE', 's-host')
      expect(result).toEqual({ error: 'room_not_found' })
    })

    it('rejects when room is not in lobby status', async () => {
      await seedRoom('R', 'p0', 'playing')
      await seedPlayers('R', 2)
      const result = await startGameService('R', 's-host')
      expect(result).toEqual({ error: 'game_already_started' })
    })

    it('rejects when caller is not the host', async () => {
      await seedRoom('R', 'p0')
      await seedPlayers('R', 2)
      const result = await startGameService('R', 's-not-host')
      expect(result).toEqual({ error: 'not_host' })
    })

    it('rejects with fewer than 2 players', async () => {
      await seedRoom('R', 'p0')
      await seedPlayers('R', 1)
      const result = await startGameService('R', 's-host')
      expect(result).toEqual({ error: 'not_enough_players' })
    })
  })

  describe('success', () => {
    beforeEach(async () => {
      await seedRoom('R', 'p0')
      await seedPlayers('R', 3)
      songQueue.push(seedSong('first-song', 1990))
    })

    it('assigns sequential turn orders 0..n-1 across all players', async () => {
      const result = await startGameService('R', 's-host')
      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        const orders = result.players.map((p) => p.turnOrder).sort()
        expect(orders).toEqual([0, 1, 2])
      }
    })

    it('updates the room status to playing', async () => {
      await startGameService('R', 's-host')
      const room = await getSessionRoom('R')
      expect(room?.status).toBe('playing')
    })

    it('writes initial game state with phase=song_phase', async () => {
      await startGameService('R', 's-host')
      const gs = await getGameState('R')
      expect(gs?.phase).toBe('song_phase')
      expect(gs?.roundNumber).toBe(1)
      expect(gs?.currentSongId).toBe('first-song')
    })

    it('sets currentPlayerId to the player at turn-order 0', async () => {
      const result = await startGameService('R', 's-host')
      if ('error' in result) throw new Error('unexpected error')
      const firstPlayer = result.players.find((p) => p.turnOrder === 0)!
      const gs = await getGameState('R')
      expect(gs?.currentPlayerId).toBe(firstPlayer.id)
    })

    it('returns a song when the catalog is non-empty', async () => {
      const result = await startGameService('R', 's-host')
      if ('error' in result) throw new Error('unexpected error')
      expect(result.song?.id).toBe('first-song')
    })

    it('returns null song and null currentSongId when the catalog is empty', async () => {
      // Queue is empty (no song pushed)
      songQueue.length = 0
      await seedRoom('R2', 'p0')
      await seedPlayers('R2', 2, 's-host-2')
      const result = await startGameService('R2', 's-host-2')
      if ('error' in result) throw new Error('unexpected error')
      expect(result.song).toBeNull()
      const gs = await getGameState('R2')
      expect(gs?.currentSongId).toBeNull()
    })
  })
})

describe('nextTurnService', () => {
  beforeEach(async () => {
    await seedRoom('R', 'p0', 'playing')
    // Three players with explicit turn orders 0, 1, 2
    await createSessionPlayer({ id: 'p0', roomCode: 'R', name: 'A', avatar: '', socketId: 's0', tokens: 2, isHost: true, turnOrder: 0 })
    await createSessionPlayer({ id: 'p1', roomCode: 'R', name: 'B', avatar: '', socketId: 's1', tokens: 2, isHost: false, turnOrder: 1 })
    await createSessionPlayer({ id: 'p2', roomCode: 'R', name: 'C', avatar: '', socketId: 's2', tokens: 2, isHost: false, turnOrder: 2 })
  })

  it('returns game_not_found when there is no cached state', async () => {
    const result = await nextTurnService('R')
    expect(result).toEqual({ error: 'game_not_found' })
  })

  it('returns no_songs_left when the catalog is exhausted', async () => {
    await setGameState('R', {
      phase: 'song_phase',
      currentPlayerId: 'p0',
      currentSongId: 'old',
      roundNumber: 1,
      phaseStartedAt: new Date().toISOString(),
    })
    // songQueue is empty
    const result = await nextTurnService('R')
    expect(result).toEqual({ error: 'no_songs_left' })
  })

  it('advances to the next player by turn order', async () => {
    await setGameState('R', {
      phase: 'steal_window',
      currentPlayerId: 'p0',
      currentSongId: 'old',
      roundNumber: 1,
      phaseStartedAt: new Date().toISOString(),
    })
    songQueue.push(seedSong('next-song'))

    const result = await nextTurnService('R')
    expect('error' in result).toBe(false)
    if (!('error' in result)) expect(result.nextPlayerId).toBe('p1')
  })

  it('wraps around from the last player back to the first', async () => {
    await setGameState('R', {
      phase: 'steal_window',
      currentPlayerId: 'p2',
      currentSongId: 'old',
      roundNumber: 5,
      phaseStartedAt: new Date().toISOString(),
    })
    songQueue.push(seedSong('next-song'))

    const result = await nextTurnService('R')
    if ('error' in result) throw new Error('unexpected error')
    expect(result.nextPlayerId).toBe('p0')
  })

  it('increments the round number on each call', async () => {
    await setGameState('R', {
      phase: 'steal_window',
      currentPlayerId: 'p0',
      currentSongId: 'old',
      roundNumber: 7,
      phaseStartedAt: new Date().toISOString(),
    })
    songQueue.push(seedSong('next-song'))

    await nextTurnService('R')
    const gs = await getGameState('R')
    expect(gs?.roundNumber).toBe(8)
  })

  it('resets phase to song_phase on advance', async () => {
    await setGameState('R', {
      phase: 'reveal',
      currentPlayerId: 'p0',
      currentSongId: 'old',
      roundNumber: 1,
      phaseStartedAt: new Date().toISOString(),
    })
    songQueue.push(seedSong('next-song'))

    await nextTurnService('R')
    const gs = await getGameState('R')
    expect(gs?.phase).toBe('song_phase')
  })
})

describe('checkWinCondition', () => {
  it('returns true when timeline length meets the threshold', async () => {
    for (let y = 1990; y < 2000; y++) {
      await addToTimeline('p1', { id: `s${y}`, title: '', artist: '', year: y, previewUrl: '', deezerTrackId: '' })
    }
    expect(await checkWinCondition('p1', 10)).toBe(true)
  })

  it('returns true when timeline length exceeds the threshold', async () => {
    for (let y = 1990; y < 2005; y++) {
      await addToTimeline('p1', { id: `s${y}`, title: '', artist: '', year: y, previewUrl: '', deezerTrackId: '' })
    }
    expect(await checkWinCondition('p1', 10)).toBe(true)
  })

  it('returns false below the threshold', async () => {
    for (let y = 1990; y < 1995; y++) {
      await addToTimeline('p1', { id: `s${y}`, title: '', artist: '', year: y, previewUrl: '', deezerTrackId: '' })
    }
    expect(await checkWinCondition('p1', 10)).toBe(false)
  })

  it('returns false for a player with no timeline', async () => {
    expect(await checkWinCondition('nobody', 10)).toBe(false)
  })
})
