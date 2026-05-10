import { describe, it, expect, beforeEach, afterAll, jest } from '@jest/globals'
import RedisMock from 'ioredis-mock'
import type { Song } from '@hitster/shared'

const redis = new RedisMock()

jest.unstable_mockModule('../../lib/redis.js', () => ({
  redis,
  pubClient: redis,
  subClient: redis,
}))

interface DbSongRow {
  id: string
  title: string
  artist: string
  year: number
  preview_url: string
  deezer_id: string
}

const songRows: Record<string, DbSongRow> = {
  'song-1990': { id: 'song-1990', title: 'Mid', artist: 'A', year: 1990, preview_url: '', deezer_id: 'd1' },
}

jest.unstable_mockModule('../../db/database.js', () => ({
  db: {
    selectFrom: () => ({
      selectAll: () => ({
        where: (_col: string, _op: string, val: string) => ({
          executeTakeFirstOrThrow: async () => {
            const row = songRows[val]
            if (!row) throw new Error(`song not found: ${val}`)
            return row
          },
        }),
      }),
    }),
  },
}))

const { validatePlacement } = await import('../placementService.js')
const { setGameState } = await import('../../lib/gameCache.js')
const { addToTimeline } = await import('../../lib/session.js')

const songFixture = (id: string, year: number): Song => ({
  id, title: '', artist: '', year, previewUrl: '', deezerTrackId: '',
})

const seedGameState = async (overrides: Partial<{ currentPlayerId: string; currentSongId: string | null }> = {}) => {
  await setGameState('ROOM', {
    phase: 'song_phase',
    currentPlayerId: 'player-1',
    currentSongId: 'song-1990',
    roundNumber: 1,
    phaseStartedAt: new Date().toISOString(),
    ...overrides,
  })
}

beforeEach(async () => {
  await redis.flushall()
})

afterAll(() => {
  redis.disconnect()
})

describe('validatePlacement', () => {
  describe('error paths', () => {
    it('rejects when no game state exists', async () => {
      const result = await validatePlacement('NO-ROOM', 'player-1', 0)
      expect(result).toEqual({ error: 'game_not_found' })
    })

    it("rejects when it's not the player's turn", async () => {
      await seedGameState()
      const result = await validatePlacement('ROOM', 'wrong-player', 0)
      expect(result).toEqual({ error: 'not_your_turn' })
    })

    it('rejects when there is no current song', async () => {
      await seedGameState({ currentSongId: null })
      const result = await validatePlacement('ROOM', 'player-1', 0)
      expect(result).toEqual({ error: 'no_current_song' })
    })

    it('rejects out-of-bounds positions (anti-cheat fix)', async () => {
      // Empty timeline -> only valid positions are 0
      await seedGameState()
      const result = await validatePlacement('ROOM', 'player-1', 9999)
      expect(result).toEqual({ error: 'invalid_position' })
    })

    it('rejects positions one past the end of a non-empty timeline + 1', async () => {
      await seedGameState()
      await addToTimeline('player-1', songFixture('a', 1980))
      // timeline.length = 1 -> valid: 0, 1; invalid: 2+
      const result = await validatePlacement('ROOM', 'player-1', 5)
      expect(result).toEqual({ error: 'invalid_position' })
    })
  })

  describe('correctness logic', () => {
    it('accepts position 0 with empty timeline', async () => {
      await seedGameState()
      const result = await validatePlacement('ROOM', 'player-1', 0)
      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        expect(result.correct).toBe(true)
        expect(result.correctPosition).toBe(0)
      }
    })

    it('accepts placement between earlier and later songs', async () => {
      await seedGameState()
      await addToTimeline('player-1', songFixture('a', 1980))
      await addToTimeline('player-1', songFixture('b', 2000))
      // Place 1990 at position 1 (between 1980 and 2000)
      const result = await validatePlacement('ROOM', 'player-1', 1)
      expect('error' in result).toBe(false)
      if (!('error' in result)) expect(result.correct).toBe(true)
    })

    it('rejects placement before an earlier song', async () => {
      await seedGameState()
      await addToTimeline('player-1', songFixture('a', 1980))
      // Place 1990 at position 0 (before 1980) — wrong, since 1990 > 1980
      const result = await validatePlacement('ROOM', 'player-1', 0)
      expect('error' in result).toBe(false)
      if (!('error' in result)) expect(result.correct).toBe(false)
    })

    it('rejects placement after a later song', async () => {
      await seedGameState()
      await addToTimeline('player-1', songFixture('a', 2000))
      // Place 1990 at position 1 (after 2000) — wrong, since 1990 < 2000
      const result = await validatePlacement('ROOM', 'player-1', 1)
      expect('error' in result).toBe(false)
      if (!('error' in result)) expect(result.correct).toBe(false)
    })

    it('reports the canonical correctPosition based on year ordering', async () => {
      await seedGameState()
      await addToTimeline('player-1', songFixture('a', 1970))
      await addToTimeline('player-1', songFixture('b', 1985))
      await addToTimeline('player-1', songFixture('c', 2010))
      // Song is 1990 — correct slot is index 2 (between 1985 and 2010)
      const result = await validatePlacement('ROOM', 'player-1', 0)
      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        expect(result.correct).toBe(false)
        expect(result.correctPosition).toBe(2)
      }
    })

    it('correctPosition equals timeline.length when song is the latest', async () => {
      await seedGameState()
      await addToTimeline('player-1', songFixture('a', 1970))
      await addToTimeline('player-1', songFixture('b', 1980))
      // Song is 1990 — correct slot is index 2 (after both)
      const result = await validatePlacement('ROOM', 'player-1', 0)
      expect('error' in result).toBe(false)
      if (!('error' in result)) expect(result.correctPosition).toBe(2)
    })
  })

  describe('side effects', () => {
    it('writes correctly placed song to the player timeline', async () => {
      await seedGameState()
      const result = await validatePlacement('ROOM', 'player-1', 0)
      expect('error' in result).toBe(false)
      if (!('error' in result) && result.correct) {
        const { getTimeline } = await import('../../lib/session.js')
        const tl = await getTimeline('player-1')
        expect(tl.length).toBe(1)
        expect(tl[0].song.id).toBe('song-1990')
      }
    })

    it('does not write incorrect placements to the timeline', async () => {
      await seedGameState()
      await addToTimeline('player-1', songFixture('a', 1980))
      // 1990 at position 0 (before 1980) is wrong
      const result = await validatePlacement('ROOM', 'player-1', 0)
      expect('error' in result).toBe(false)
      if (!('error' in result)) expect(result.correct).toBe(false)

      const { getTimelineCount } = await import('../../lib/session.js')
      // Only the seeded song, not the wrong placement
      expect(await getTimelineCount('player-1')).toBe(1)
    })

    it('advances phase to steal_window', async () => {
      await seedGameState()
      await validatePlacement('ROOM', 'player-1', 0)
      const { getGameState } = await import('../../lib/gameCache.js')
      const gs = await getGameState('ROOM')
      expect(gs?.phase).toBe('steal_window')
    })
  })
})
