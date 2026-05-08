import { GamePhase } from './enums'
import type { Player, Song, RoomSettings, GameState } from './types'

export interface CreateRoomPayload {
  hostName: string
  settings: RoomSettings
}

export interface CreateRoomResult {
  roomCode: string
  playerId: string
}

export interface JoinRoomPayload {
  roomCode: string
  playerName: string
}

export interface JoinRoomResult {
  success: boolean
  error?: 'room_not_found' | 'room_full' | 'game_already_started'
  roomCode?: string
  playerId?: string
  players?: Player[]
  settings?: RoomSettings
}

export interface PlacePayload {
  position: number
}

export interface GuessPayload {
  artist: string
  title: string
}

export interface StealPayload {
  targetPlayerId: string
  position: number
}

export interface PlacementResultPayload {
  playerId: string
  correct: boolean
  song: Song
  correctPosition: number
}

export interface StealResultPayload {
  success: boolean
  stealerId: string
  targetPlayerId: string
  correct: boolean
  song: Song
}

export interface ServerToClientEvents {
  'player:joined': (player: Player) => void
  'player:left': (playerId: string) => void
  'game:starting': (state: GameState, players: Player[]) => void
  'song:new': (song: Song) => void
'phase:changed': (phase: GamePhase, phaseStartedAt: string, currentPlayerId?: string) => void
  'token:earned': (playerId: string, newTotal: number) => void
  'song:skipped': (newSong: Song) => void
  'placement:result': (result: PlacementResultPayload) => void
  'steal:result': (result: StealResultPayload) => void
  'game:over': (winnerId: string, players: Player[]) => void
  'error': (message: string) => void
  'audio:play': () => void
  'audio:pause': () => void
}

export interface ClientToServerEvents {
  'room:create': (payload: CreateRoomPayload, cb: (result: CreateRoomResult) => void) => void
  'room:join': (payload: JoinRoomPayload, cb: (result: JoinRoomResult) => void) => void
  'game:start': (cb: (error?: string) => void) => void
  'song:guess': (payload: GuessPayload) => void
  'song:skip': (cb: (error?: string) => void) => void
  'card:place': (payload: PlacePayload, cb: (error?: string) => void) => void
  'steal:attempt': (payload: StealPayload, cb: (error?: string) => void) => void
  'audio:play': () => void
  'audio:pause': () => void
}