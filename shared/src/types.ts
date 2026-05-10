import type { GamePhase, Decade } from './enums.js'

export interface Song {
  id: string
  title: string
  artist: string
  year: number
  previewUrl: string
  deezerTrackId: string
}

export interface TimelineEntry {
  song: Song
  position: number
}

export interface Player {
  id: string
  name: string
  avatar?: string
  tokens: number
  isHost: boolean
  turnOrder: number
  timeline: TimelineEntry[]
}

export interface RoomSettings {
  songsPerPlayer: number
  decadeFilter: Decade
}

export interface GameState {
  phase: GamePhase
  currentPlayerId: string
  currentSong: Song | null
  roundNumber: number
  phaseStartedAt: string
}