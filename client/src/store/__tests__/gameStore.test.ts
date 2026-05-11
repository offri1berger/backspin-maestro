import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

// Vitest's default `node` environment has no DOM — supply a minimal
// in-memory sessionStorage so gameStore's persistSession/loadSession work.
beforeAll(() => {
  const store = new Map<string, string>()
  ;(globalThis as { sessionStorage: Storage }).sessionStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => { store.set(k, v) },
    removeItem: (k) => { store.delete(k) },
    clear: () => store.clear(),
    key: (i) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size },
  }
})

const { useGameStore } = await import('../gameStore')

// Reset the singleton store between tests so we don't leak state.
const snapshot = useGameStore.getState()
beforeEach(() => {
  useGameStore.setState(snapshot, true)
  // Clean sessionStorage so persistSession/loadSession don't leak between tests.
  sessionStorage.clear()
})

describe('gameStore (smoke)', () => {
  it('starts in a clean disconnected-ish state', () => {
    const s = useGameStore.getState()
    expect(s.roomCode).toBeNull()
    expect(s.playerId).toBeNull()
    expect(s.players).toEqual([])
    expect(s.connectionStatus).toBe('connecting')
  })

  it('setRoom persists a session and marks the connection as live', () => {
    useGameStore.getState().setRoom('ABCDEF', 'player-1')
    const s = useGameStore.getState()
    expect(s.roomCode).toBe('ABCDEF')
    expect(s.playerId).toBe('player-1')
    expect(s.connectionStatus).toBe('connected')
    expect(sessionStorage.getItem('hitster_session')).toContain('ABCDEF')
  })

  it('leaveRoom clears state and the persisted session', () => {
    const store = useGameStore.getState()
    store.setRoom('ABCDEF', 'player-1')
    store.leaveRoom()
    const s = useGameStore.getState()
    expect(s.roomCode).toBeNull()
    expect(s.playerId).toBeNull()
    expect(sessionStorage.getItem('hitster_session')).toBeNull()
  })

  it('tracks disconnected players without duplicating ids', () => {
    const store = useGameStore.getState()
    store.setPlayerDisconnected('p1')
    store.setPlayerDisconnected('p1')
    expect(useGameStore.getState().disconnectedPlayerIds).toEqual(['p1'])
    store.setPlayerReconnected('p1')
    expect(useGameStore.getState().disconnectedPlayerIds).toEqual([])
  })
})
