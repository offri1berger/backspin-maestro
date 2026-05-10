import { describe, it, expect, beforeEach, afterAll, jest } from '@jest/globals'
import RedisMock from 'ioredis-mock'
import type { Song } from '@hitster/shared'

const redis = new RedisMock()

jest.unstable_mockModule('../redis.js', () => ({
  redis,
  pubClient: redis,
  subClient: redis,
}))

const {
  addToTimeline,
  getTimeline,
  getTimelineCount,
  createSessionRoom,
  createSessionPlayer,
  getSessionPlayer,
  getSessionRoom,
  getPlayersByRoomCode,
  getPlayerBySocketId,
  updatePlayerSocketId,
  updatePlayerTokens,
  updatePlayerTurnOrder,
  resetSessionPlayer,
  removeSessionPlayer,
  transferHost,
  deleteSessionRoom,
} = await import('../session.js')

const song = (id: string, year: number): Song => ({
  id, title: '', artist: '', year, previewUrl: '', deezerTrackId: '',
})

beforeEach(async () => {
  await redis.flushall()
})

afterAll(() => {
  redis.disconnect()
})

describe('timeline', () => {
  it('returns entries in chronological order regardless of insertion order', async () => {
    await addToTimeline('p1', song('a', 2000))
    await addToTimeline('p1', song('b', 1980))
    await addToTimeline('p1', song('c', 1995))

    const tl = await getTimeline('p1')
    expect(tl.map((t) => t.song.year)).toEqual([1980, 1995, 2000])
    expect(tl.map((t) => t.position)).toEqual([0, 1, 2])
  })

  it('stores two songs from the same year as separate entries', async () => {
    await addToTimeline('p1', song('a', 1990))
    await addToTimeline('p1', song('b', 1990))
    expect(await getTimelineCount('p1')).toBe(2)
  })

  it('returns empty for unknown players', async () => {
    expect(await getTimeline('nobody')).toEqual([])
    expect(await getTimelineCount('nobody')).toBe(0)
  })
})

describe('player CRUD', () => {
  it('round-trips a player', async () => {
    await createSessionPlayer({
      id: 'p1', roomCode: 'R', name: 'Alice', avatar: '',
      socketId: 's1', tokens: 2, isHost: true, turnOrder: 0,
    })
    const p = await getSessionPlayer('p1')
    expect(p?.name).toBe('Alice')
    expect(p?.isHost).toBe(true)
  })

  it('looks up a player by socket id', async () => {
    await createSessionPlayer({
      id: 'p1', roomCode: 'R', name: 'A', avatar: '',
      socketId: 'socket-1', tokens: 2, isHost: false, turnOrder: 0,
    })
    expect((await getPlayerBySocketId('socket-1'))?.id).toBe('p1')
    expect(await getPlayerBySocketId('unknown')).toBeNull()
  })

  it('updatePlayerSocketId removes old mapping and creates new one', async () => {
    await createSessionPlayer({
      id: 'p1', roomCode: 'R', name: 'A', avatar: '',
      socketId: 'old-socket', tokens: 2, isHost: false, turnOrder: 0,
    })
    await updatePlayerSocketId('p1', 'new-socket')

    expect(await getPlayerBySocketId('old-socket')).toBeNull()
    expect((await getPlayerBySocketId('new-socket'))?.id).toBe('p1')
  })

  it('updatePlayerTokens updates only tokens', async () => {
    await createSessionPlayer({
      id: 'p1', roomCode: 'R', name: 'A', avatar: '',
      socketId: 's1', tokens: 2, isHost: true, turnOrder: 5,
    })
    await updatePlayerTokens('p1', 7)
    const p = await getSessionPlayer('p1')
    expect(p?.tokens).toBe(7)
    expect(p?.turnOrder).toBe(5)
    expect(p?.isHost).toBe(true)
  })

  it('updatePlayerTurnOrder updates only turn order', async () => {
    await createSessionPlayer({
      id: 'p1', roomCode: 'R', name: 'A', avatar: '',
      socketId: 's1', tokens: 3, isHost: false, turnOrder: 0,
    })
    await updatePlayerTurnOrder('p1', 2)
    const p = await getSessionPlayer('p1')
    expect(p?.turnOrder).toBe(2)
    expect(p?.tokens).toBe(3)
  })

  it('getPlayersByRoomCode returns all members of a room', async () => {
    await createSessionPlayer({ id: 'p1', roomCode: 'R', name: 'A', avatar: '', socketId: 's1', tokens: 2, isHost: true, turnOrder: 0 })
    await createSessionPlayer({ id: 'p2', roomCode: 'R', name: 'B', avatar: '', socketId: 's2', tokens: 2, isHost: false, turnOrder: 1 })
    await createSessionPlayer({ id: 'p3', roomCode: 'OTHER', name: 'C', avatar: '', socketId: 's3', tokens: 2, isHost: true, turnOrder: 0 })

    const players = await getPlayersByRoomCode('R')
    expect(players.map((p) => p.id).sort()).toEqual(['p1', 'p2'])
  })
})

describe('reset / remove', () => {
  it('resetSessionPlayer clears timeline, resets tokens & turnOrder, preserves isHost', async () => {
    await createSessionPlayer({
      id: 'p1', roomCode: 'R', name: 'A', avatar: '',
      socketId: 's1', tokens: 0, isHost: true, turnOrder: 3,
    })
    await addToTimeline('p1', song('x', 2000))
    await addToTimeline('p1', song('y', 2010))

    await resetSessionPlayer('p1')

    const p = await getSessionPlayer('p1')
    expect(p?.tokens).toBe(2)
    expect(p?.turnOrder).toBe(0)
    expect(p?.isHost).toBe(true)
    expect(await getTimelineCount('p1')).toBe(0)
  })

  it('removeSessionPlayer deletes player, timeline, and socket mapping', async () => {
    await createSessionPlayer({
      id: 'p1', roomCode: 'R', name: 'A', avatar: '',
      socketId: 's1', tokens: 2, isHost: false, turnOrder: 0,
    })
    await addToTimeline('p1', song('x', 2000))
    await removeSessionPlayer('p1')

    expect(await getSessionPlayer('p1')).toBeNull()
    expect(await getPlayerBySocketId('s1')).toBeNull()
    expect(await getTimelineCount('p1')).toBe(0)
  })
})

describe('host transfer', () => {
  it('flips isHost flags and updates room.hostId', async () => {
    await createSessionRoom('R', { status: 'lobby', hostId: 'p1', songsPerPlayer: 10, decadeFilter: 'all' })
    await createSessionPlayer({ id: 'p1', roomCode: 'R', name: 'A', avatar: '', socketId: 's1', tokens: 2, isHost: true, turnOrder: 0 })
    await createSessionPlayer({ id: 'p2', roomCode: 'R', name: 'B', avatar: '', socketId: 's2', tokens: 2, isHost: false, turnOrder: 1 })

    await transferHost('R', 'p1', 'p2')

    expect((await getSessionPlayer('p1'))?.isHost).toBe(false)
    expect((await getSessionPlayer('p2'))?.isHost).toBe(true)
    expect((await getSessionRoom('R'))?.hostId).toBe('p2')
  })
})

describe('deleteSessionRoom', () => {
  it('removes room, all players, and their timelines/socket mappings', async () => {
    await createSessionRoom('R', { status: 'lobby', hostId: 'p1', songsPerPlayer: 10, decadeFilter: 'all' })
    await createSessionPlayer({ id: 'p1', roomCode: 'R', name: 'A', avatar: '', socketId: 's1', tokens: 2, isHost: true, turnOrder: 0 })
    await createSessionPlayer({ id: 'p2', roomCode: 'R', name: 'B', avatar: '', socketId: 's2', tokens: 2, isHost: false, turnOrder: 1 })
    await addToTimeline('p1', song('x', 2000))

    await deleteSessionRoom('R')

    expect(await getSessionRoom('R')).toBeNull()
    expect(await getSessionPlayer('p1')).toBeNull()
    expect(await getSessionPlayer('p2')).toBeNull()
    expect(await getPlayerBySocketId('s1')).toBeNull()
    expect(await getTimelineCount('p1')).toBe(0)
    expect(await getPlayersByRoomCode('R')).toEqual([])
  })
})
