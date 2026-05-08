import { create } from 'zustand'
import type { GamePhase, Player, Song, RoomSettings } from '@hitster/shared'

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
  placementResult: { correct: boolean; message?: string } | null
  isWaitingForNextTurn: boolean
  hasGuessed: boolean
  winnerId: string | null

  setRoom: (roomCode: string, playerId: string) => void
  setPlayers: (players: Player[]) => void
  addPlayer: (player: Player) => void
  removePlayer: (playerId: string) => void
  setGameStarted: (players: Player[], phase: GamePhase, currentPlayerId: string) => void
  setCurrentSong: (song: Song) => void
  setPhase: (phase: GamePhase) => void
  setCurrentPlayerId: (id: string) => void
  setPendingPosition: (position: number | null) => void
  setPlacementResult: (result: { correct: boolean; message?: string } | null) => void
  setIsWaitingForNextTurn: (val: boolean) => void
  setHasGuessed: (val: boolean) => void
  setGameOver: (winnerId: string) => void
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

  setRoom: (roomCode, playerId) => set({ roomCode, playerId }),
  setPlayers: (players) => set({ players }),
  addPlayer: (player) => set((state) => ({ players: [...state.players, player] })),
  removePlayer: (playerId) =>
    set((state) => ({ players: state.players.filter((p) => p.id !== playerId) })),
  setGameStarted: (players, phase, currentPlayerId) =>
    set({ players, phase, currentPlayerId }),
  setCurrentSong: (song) => set({ currentSong: song }),
  setPhase: (phase) => set({ phase }),
  setCurrentPlayerId: (id) => set({ currentPlayerId: id }),
  setPendingPosition: (position) => set({ pendingPosition: position }),
  setPlacementResult: (result) => set({ placementResult: result }),
  setIsWaitingForNextTurn: (val) => set({ isWaitingForNextTurn: val }),
  setHasGuessed: (val) => set({ hasGuessed: val }),
  setGameOver: (winnerId) => set({ winnerId, phase: 'game_over' }),
}))