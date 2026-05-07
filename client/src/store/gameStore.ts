import { create } from 'zustand'
import type { GamePhase, Player, Song, RoomSettings } from '@hitster/shared'

interface GameStore {
  // room
  roomCode: string | null
  playerId: string | null
  settings: RoomSettings | null

  // players
  players: Player[]

  // game
  phase: GamePhase | null
  currentPlayerId: string | null
  currentSong: Song | null
  roundNumber: number

  // actions
  setRoom: (roomCode: string, playerId: string) => void
  setPlayers: (players: Player[]) => void
  addPlayer: (player: Player) => void
  removePlayer: (playerId: string) => void
  setGameStarted: (players: Player[], phase: GamePhase, currentPlayerId: string) => void
  setCurrentSong: (song: Song) => void
  setPhase: (phase: GamePhase) => void
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

  setRoom: (roomCode, playerId) => set({ roomCode, playerId }),
  setPlayers: (players) => set({ players }),
  addPlayer: (player) => set((state) => ({ players: [...state.players, player] })),
  removePlayer: (playerId) =>
    set((state) => ({ players: state.players.filter((p) => p.id !== playerId) })),
  setGameStarted: (players, phase, currentPlayerId) =>
    set({ players, phase, currentPlayerId }),
  setCurrentSong: (song) => set({ currentSong: song }),
  setPhase: (phase) => set({ phase }),
}))