import { describe, it, expect, beforeEach, afterAll, jest } from '@jest/globals'
import RedisMock from 'ioredis-mock'
import type { PlacementResultPayload } from '@hitster/shared'

const redis = new RedisMock()

jest.unstable_mockModule('../redis.js', () => ({
  redis,
  pubClient: redis,
  subClient: redis,
}))

const {
  setPending,
  getPending,
  clearPending,
  openStealWindow,
  tryClaimResolution,
  isResolved,
  clearResolved,
  cleanupRoomState,
} = await import('../roomTimeouts.js')

const fixturePayload = (overrides: Partial<PlacementResultPayload> = {}): PlacementResultPayload => ({
  playerId: 'p1',
  correct: true,
  song: { id: 's1', title: 'T', artist: 'A', year: 2000, previewUrl: '', deezerTrackId: 'd1' },
  correctPosition: 0,
  ...overrides,
})

beforeEach(async () => {
  await redis.flushall()
})

afterAll(() => {
  redis.disconnect()
})

describe('roomTimeouts', () => {
  describe('pending payload', () => {
    it('round-trips a pending payload', async () => {
      await setPending('ABC', fixturePayload({ playerId: 'p9' }))
      const result = await getPending('ABC')
      expect(result?.playerId).toBe('p9')
    })

    it('returns null for missing pending', async () => {
      expect(await getPending('XYZ')).toBeNull()
    })

    it('clearPending removes the payload', async () => {
      await setPending('ABC', fixturePayload())
      await clearPending('ABC')
      expect(await getPending('ABC')).toBeNull()
    })

    it('drops corrupt pending payloads and returns null', async () => {
      await redis.set('pending:ABC', 'not-json')
      expect(await getPending('ABC')).toBeNull()
      // self-heal: corrupt entry should be cleaned up
      expect(await redis.get('pending:ABC')).toBeNull()
    })
  })

  describe('resolution lock', () => {
    it('tryClaimResolution returns true on first call, false on second', async () => {
      expect(await tryClaimResolution('ABC')).toBe(true)
      expect(await tryClaimResolution('ABC')).toBe(false)
    })

    it('tryClaimResolution is per-room (independent locks)', async () => {
      expect(await tryClaimResolution('ROOM-A')).toBe(true)
      expect(await tryClaimResolution('ROOM-B')).toBe(true)
    })

    it('isResolved reflects claim state', async () => {
      expect(await isResolved('ABC')).toBe(false)
      await tryClaimResolution('ABC')
      expect(await isResolved('ABC')).toBe(true)
    })

    it('clearResolved unlocks the room', async () => {
      await tryClaimResolution('ABC')
      await clearResolved('ABC')
      expect(await isResolved('ABC')).toBe(false)
      // and a new claim can succeed again
      expect(await tryClaimResolution('ABC')).toBe(true)
    })
  })

  describe('openStealWindow', () => {
    it('clears prior resolved lock and writes pending payload atomically', async () => {
      await tryClaimResolution('ABC')
      expect(await isResolved('ABC')).toBe(true)

      await openStealWindow('ABC', fixturePayload({ playerId: 'next-round' }))

      expect(await isResolved('ABC')).toBe(false)
      const pending = await getPending('ABC')
      expect(pending?.playerId).toBe('next-round')
    })

    it('overwrites a stale pending payload', async () => {
      await setPending('ABC', fixturePayload({ playerId: 'stale' }))
      await openStealWindow('ABC', fixturePayload({ playerId: 'fresh' }))
      const pending = await getPending('ABC')
      expect(pending?.playerId).toBe('fresh')
    })
  })

  describe('cleanupRoomState', () => {
    it('clears both pending and resolved', async () => {
      await setPending('ABC', fixturePayload())
      await tryClaimResolution('ABC')
      await cleanupRoomState('ABC')
      expect(await getPending('ABC')).toBeNull()
      expect(await isResolved('ABC')).toBe(false)
    })

    it('is safe when nothing to clean', async () => {
      await expect(cleanupRoomState('NEVER-USED')).resolves.toBeUndefined()
    })
  })
})
