import { create } from 'zustand'
import type { GamePhase, Player, Song, RoomSettings, StealResultPayload } from '@hitster/shared'

const SESSION_KEY = 'hitster_session'

export const persistSession = (roomCode: string, playerId: string) =>
  localStorage.setItem(SESSION_KEY, JSON.stringify({ roomCode, playerId }))

export const clearSession = () => localStorage.removeItem(SESSION_KEY)

export const loadSession = (): { roomCode: string; playerId: string } | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

interface GameStore {
  roomCode: string | null
  playerId: string | null
  settings: RoomSettings | null
  players: Player[]
  phase: GamePhase | null
  currentPlayerId: string | null
  currentSong: Song | null
  roundNumber: number
  pendingPosition: number | null
  placementResult: { correct: boolean; message?: string; song?: Song } | null
  isWaitingForNextTurn: boolean
  hasGuessed: boolean
  winnerId: string | null
  remoteDragSlot: number | null
  stealResult: StealResultPayload | null
  isStealWindowOpen: boolean
  stealInitiatorId: string | null

  disconnectedPlayerIds: string[]
  setRoom: (roomCode: string, playerId: string) => void
  setSettings: (settings: RoomSettings) => void
  restoreSession: (data: { roomCode: string; playerId: string; players: Player[]; settings: RoomSettings; phase?: GamePhase; currentPlayerId?: string; currentSong?: Song | null; roundNumber?: number }) => void
  setPlayers: (players: Player[]) => void
  setPlayerDisconnected: (id: string) => void
  setPlayerReconnected: (id: string) => void
  transferHost: (newHostId: string) => void
  addPlayer: (player: Player) => void
  removePlayer: (playerId: string) => void
  setGameStarted: (players: Player[], phase: GamePhase, currentPlayerId: string) => void
  setCurrentSong: (song: Song) => void
  setPhase: (phase: GamePhase) => void
  setCurrentPlayerId: (id: string) => void
  setPendingPosition: (position: number | null) => void
  setPlacementResult: (result: { correct: boolean; message?: string; song?: Song } | null) => void
  setIsWaitingForNextTurn: (val: boolean) => void
  setHasGuessed: (val: boolean) => void
  setGameOver: (winnerId: string) => void
  setRemoteDragSlot: (slot: number | null) => void
  setStealResult: (result: StealResultPayload | null) => void
  setIsStealWindowOpen: (val: boolean) => void
  setStealInitiatorId: (id: string | null) => void
}

export const useGameStore = create<GameStore>((set) => ({
  roomCode: null,
  playerId: null,
  settings: null,
  players: [],
  phase: null,
  currentPlayerId: null,
  currentSong: null,
  roundNumber: 1,
  pendingPosition: null,
  placementResult: null,
  isWaitingForNextTurn: false,
  hasGuessed: false,
  winnerId: null,
  remoteDragSlot: null,
  stealResult: null,
  isStealWindowOpen: false,
  stealInitiatorId: null,
  disconnectedPlayerIds: [],

  setRoom: (roomCode, playerId) => {
    persistSession(roomCode, playerId)
    set({ roomCode, playerId })
  },
  setSettings: (settings) => set({ settings }),
  restoreSession: ({ roomCode, playerId, players, settings, phase, currentPlayerId, currentSong, roundNumber }) =>
    set({ roomCode, playerId, players, settings, phase: phase ?? null, currentPlayerId: currentPlayerId ?? null, currentSong: currentSong ?? null, roundNumber: roundNumber ?? 1 }),
  setPlayers: (players) => set({ players }),
  addPlayer: (player) => set((state) => ({ players: [...state.players, player] })),
  removePlayer: (playerId) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
      disconnectedPlayerIds: state.disconnectedPlayerIds.filter((id) => id !== playerId),
    })),
  setGameStarted: (players, phase, currentPlayerId) =>
    set({ players, phase, currentPlayerId }),
  setCurrentSong: (song) => set({ currentSong: song }),
  setPhase: (phase) => set({ phase }),
  setCurrentPlayerId: (id) => set({ currentPlayerId: id }),
  setPendingPosition: (position) => set({ pendingPosition: position }),
  setPlacementResult: (result) => set({ placementResult: result }),
  setIsWaitingForNextTurn: (val) => set({ isWaitingForNextTurn: val }),
  setHasGuessed: (val) => set({ hasGuessed: val }),
  setGameOver: (winnerId) => { clearSession(); set({ winnerId, phase: 'game_over' }) },
  setRemoteDragSlot: (slot) => set({ remoteDragSlot: slot }),
  setStealResult: (result) => set({ stealResult: result }),
  setIsStealWindowOpen: (val) => set({ isStealWindowOpen: val }),
  setStealInitiatorId: (id) => set({ stealInitiatorId: id }),
  setPlayerDisconnected: (id) => set((s) => ({ disconnectedPlayerIds: s.disconnectedPlayerIds.includes(id) ? s.disconnectedPlayerIds : [...s.disconnectedPlayerIds, id] })),
  setPlayerReconnected: (id) => set((s) => ({ disconnectedPlayerIds: s.disconnectedPlayerIds.filter((x) => x !== id) })),
  transferHost: (newHostId) => set((s) => ({
    players: s.players.map((p) => ({ ...p, isHost: p.id === newHostId })),
  })),
}))