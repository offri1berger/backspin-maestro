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
const markedAsUsed: Array<{ roomCode: string; songId: string }> = []

jest.unstable_mockModule('../songService.js', () => ({
  getRandomSong: jest.fn(async () => songQueue.shift() ?? null),
  markSongAsUsed: jest.fn(async (roomCode: string, songId: string) => {
    markedAsUsed.push({ roomCode, songId })
  }),
  getFreshPreviewUrl: jest.fn(async () => null),
}))

// Mock the db module — only used by rejoinRoomService for currentSong lookup.
const songRows: Record<string, MockSong> = {}
jest.unstable_mockModule('../../db/database.js', () => ({
  db: {
    selectFrom: () => ({
      selectAll: () => ({
        where: (_col: string, _op: string, val: string) => ({
          executeTakeFirst: async () => songRows[val] ?? null,
        }),
      }),
    }),
  },
}))

const {
  createRoomService,
  joinRoomService,
  rejoinRoomService,
  resetRoomService,
} = await import('../roomService.js')

const {
  createSessionRoom,
  createSessionPlayer,
  getSessionRoom,
  getSessionPlayer,
  getPlayersByRoomCode,
  getTimeline,
  addToTimeline,
} = await import('../../lib/session.js')

const { setGameState, getGameState } = await import('../../lib/gameCache.js')

const stockSong = (id: string, year = 2000): MockSong => ({
  id, title: 't', artist: 'a', year, preview_url: '', deezer_id: `d-${id}`,
})

beforeEach(async () => {
  await redis.flushall()
  songQueue.length = 0
  markedAsUsed.length = 0
  for (const k of Object.keys(songRows)) delete songRows[k]
})

afterAll(() => {
  redis.disconnect()
})

describe('createRoomService', () => {
  it('creates a room with the host player and returns roomCode + playerId', async () => {
    songQueue.push(stockSong('starter'))
    const result = await createRoomService(
      { hostName: 'Alice', avatar: 'a.png', settings: { songsPerPlayer: 10, decadeFilter: 'all' } },
      'socket-1',
    )

    expect(result.roomCode).toMatch(/^[0-9A-F]{6}$/)
    expect(result.playerId).toBeDefined()

    const room = await getSessionRoom(result.roomCode)
    expect(room?.status).toBe('lobby')
    expect(room?.hostId).toBe(result.playerId)
    expect(room?.songsPerPlayer).toBe(10)

    const host = await getSessionPlayer(result.playerId)
    expect(host?.name).toBe('Alice')
    expect(host?.avatar).toBe('a.png')
    expect(host?.tokens).toBe(2)
    expect(host?.isHost).toBe(true)
    expect(host?.socketId).toBe('socket-1')
  })

  it('does not pre-seed the host timeline (seeds are assigned at game start)', async () => {
    const result = await createRoomService(
      { hostName: 'Alice', settings: { songsPerPlayer: 10, decadeFilter: 'all' } },
      'socket-1',
    )
    const tl = await getTimeline(result.playerId)
    expect(tl.length).toBe(0)
  })

  it('survives an empty song catalog (no starter card)', async () => {
    // songQueue empty
    const result = await createRoomService(
      { hostName: 'Alice', settings: { songsPerPlayer: 10, decadeFilter: 'all' } },
      'socket-1',
    )
    const tl = await getTimeline(result.playerId)
    expect(tl.length).toBe(0)
  })
})

describe('joinRoomService', () => {
  beforeEach(async () => {
    await createSessionRoom('ROOM', { status: 'lobby', hostId: 'host', songsPerPlayer: 10, decadeFilter: 'all' })
    await createSessionPlayer({ id: 'host', roomCode: 'ROOM', name: 'Host', avatar: '', socketId: 's-host', tokens: 2, isHost: true, turnOrder: 0 })
  })

  it('errors when the room does not exist', async () => {
    const result = await joinRoomService(
      { roomCode: 'NOPE', playerName: 'Bob' },
      's-bob',
    )
    expect(result).toEqual({ success: false, error: 'room_not_found' })
  })

  it('errors when the game has already started', async () => {
    await createSessionRoom('PLAY', { status: 'playing', hostId: 'host', songsPerPlayer: 10, decadeFilter: 'all' })
    const result = await joinRoomService(
      { roomCode: 'PLAY', playerName: 'Bob' },
      's-bob',
    )
    expect(result).toEqual({ success: false, error: 'game_already_started' })
  })

  it('errors when the room is full (6 players)', async () => {
    for (let i = 1; i <= 5; i++) {
      await createSessionPlayer({ id: `p${i}`, roomCode: 'ROOM', name: `P${i}`, avatar: '', socketId: `s${i}`, tokens: 2, isHost: false, turnOrder: 0 })
    }
    const result = await joinRoomService(
      { roomCode: 'ROOM', playerName: 'Seventh' },
      's-seventh',
    )
    expect(result).toEqual({ success: false, error: 'room_full' })
  })

  it('creates a new player and returns the existing player roster', async () => {
    songQueue.push(stockSong('starter-bob'))
    const result = await joinRoomService(
      { roomCode: 'ROOM', playerName: 'Bob', avatar: 'b.png' },
      's-bob',
    )

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.roomCode).toBe('ROOM')
      expect(result.players?.map((p) => p.name)).toEqual(['Host'])
      expect(result.settings?.songsPerPlayer).toBe(10)

      const newPlayer = await getSessionPlayer(result.playerId!)
      expect(newPlayer?.name).toBe('Bob')
      expect(newPlayer?.isHost).toBe(false)
      expect(newPlayer?.tokens).toBe(2)
    }
  })

  it('does not pre-seed the joining player timeline (seeds are assigned at game start)', async () => {
    const result = await joinRoomService(
      { roomCode: 'ROOM', playerName: 'Bob' },
      's-bob',
    )
    if (!result.success) throw new Error('unexpected')

    const tl = await getTimeline(result.playerId!)
    expect(tl.length).toBe(0)
  })
})

describe('rejoinRoomService', () => {
  beforeEach(async () => {
    await createSessionRoom('ROOM', { status: 'lobby', hostId: 'host', songsPerPlayer: 10, decadeFilter: 'all' })
    await createSessionPlayer({ id: 'host', roomCode: 'ROOM', name: 'Host', avatar: '', socketId: 's-old', tokens: 2, isHost: true, turnOrder: 0 })
  })

  it('errors when the room does not exist', async () => {
    const result = await rejoinRoomService('host', 'NOPE', 's-new')
    expect(result).toEqual({ success: false, error: 'room_not_found' })
  })

  it('errors when the player is not in the room', async () => {
    const result = await rejoinRoomService('stranger', 'ROOM', 's-new')
    expect(result).toEqual({ success: false, error: 'player_not_found' })
  })

  it('errors when the player belongs to a different room', async () => {
    await createSessionRoom('OTHER', { status: 'lobby', hostId: 'h2', songsPerPlayer: 10, decadeFilter: 'all' })
    await createSessionPlayer({ id: 'h2', roomCode: 'OTHER', name: 'H2', avatar: '', socketId: 's-h2', tokens: 2, isHost: true, turnOrder: 0 })
    // h2 tries to rejoin ROOM (a different room)
    const result = await rejoinRoomService('h2', 'ROOM', 's-new')
    expect(result).toEqual({ success: false, error: 'player_not_found' })
  })

  it('updates the player socket id on successful rejoin', async () => {
    await rejoinRoomService('host', 'ROOM', 's-fresh')
    const p = await getSessionPlayer('host')
    expect(p?.socketId).toBe('s-fresh')
  })

  it('returns players with their full timelines', async () => {
    await addToTimeline('host', { id: 'tl-1', title: '', artist: '', year: 2000, previewUrl: '', deezerTrackId: '' })
    const result = await rejoinRoomService('host', 'ROOM', 's-new')
    if (!result.success) throw new Error('unexpected')

    const me = result.players.find((p) => p.id === 'host')
    expect(me?.timeline.length).toBe(1)
    expect(me?.timeline[0].song.id).toBe('tl-1')
  })

  it('returns null gameState when the room is in lobby', async () => {
    const result = await rejoinRoomService('host', 'ROOM', 's-new')
    if (!result.success) throw new Error('unexpected')
    expect(result.gameState).toBeNull()
    expect(result.roomStatus).toBe('lobby')
  })

  it('returns the cached gameState when the room is playing', async () => {
    // Move room to playing and seed game state
    await createSessionRoom('ROOM', { status: 'playing', hostId: 'host', songsPerPlayer: 10, decadeFilter: 'all' })
    songRows['live-song'] = stockSong('live-song', 1995)
    await setGameState('ROOM', {
      phase: 'song_phase',
      currentPlayerId: 'host',
      currentSongId: 'live-song',
      roundNumber: 4,
      phaseStartedAt: '2026-01-01T00:00:00.000Z',
    })

    const result = await rejoinRoomService('host', 'ROOM', 's-new')
    if (!result.success) throw new Error('unexpected')

    expect(result.roomStatus).toBe('playing')
    expect(result.gameState?.phase).toBe('song_phase')
    expect(result.gameState?.currentPlayerId).toBe('host')
    expect(result.gameState?.roundNumber).toBe(4)
    expect(result.gameState?.currentSong?.id).toBe('live-song')
  })
})

describe('resetRoomService', () => {
  beforeEach(async () => {
    await createSessionRoom('ROOM', { status: 'playing', hostId: 'host', songsPerPlayer: 10, decadeFilter: 'all' })
    await createSessionPlayer({ id: 'host', roomCode: 'ROOM', name: 'Host', avatar: '', socketId: 's-host', tokens: 0, isHost: true, turnOrder: 2 })
    await createSessionPlayer({ id: 'p1', roomCode: 'ROOM', name: 'P1', avatar: '', socketId: 's-p1', tokens: 1, isHost: false, turnOrder: 0 })
    await addToTimeline('host', { id: 'old', title: '', artist: '', year: 2000, previewUrl: '', deezerTrackId: '' })
    await setGameState('ROOM', {
      phase: 'reveal',
      currentPlayerId: 'host',
      currentSongId: 'old',
      roundNumber: 9,
      phaseStartedAt: '2026-01-01T00:00:00.000Z',
    })
  })

  it('errors when the room does not exist', async () => {
    const result = await resetRoomService('NOPE', 's-host')
    expect(result).toEqual({ error: 'room_not_found' })
  })

  it('errors when the caller is not the host', async () => {
    const result = await resetRoomService('ROOM', 's-p1')
    expect(result).toEqual({ error: 'not_host' })
  })

  it('moves the room back to lobby status', async () => {
    await resetRoomService('ROOM', 's-host')
    const room = await getSessionRoom('ROOM')
    expect(room?.status).toBe('lobby')
  })

  it('clears the cached game state', async () => {
    await resetRoomService('ROOM', 's-host')
    expect(await getGameState('ROOM')).toBeNull()
  })

  it('resets every player to 2 tokens, turn order 0, and clears their timeline', async () => {
    await resetRoomService('ROOM', 's-host')

    const host = await getSessionPlayer('host')
    expect(host?.tokens).toBe(2)
    expect(host?.turnOrder).toBe(0)
    expect(host?.isHost).toBe(true)

    // Timeline cleared; seeds are assigned at the next game start, not at reset
    const tl = await getTimeline('host')
    expect(tl.length).toBe(0)
  })

  it('returns the player list with cleared timelines', async () => {
    const result = await resetRoomService('ROOM', 's-host')
    if ('error' in result) throw new Error('unexpected')

    expect(result.players.length).toBe(2)
    expect(result.players.every((p) => p.tokens === 2)).toBe(true)
    expect(result.players.every((p) => p.timeline.length === 0)).toBe(true)
  })

  it('uses getPlayersByRoomCode after reset to confirm both players persisted', async () => {
    await resetRoomService('ROOM', 's-host')
    const players = await getPlayersByRoomCode('ROOM')
    expect(players.length).toBe(2)
  })
})
