import { GamePhase } from './enums'
import type { RoomStatus } from './enums'
import type { Player, Song, RoomSettings, GameState, TimelineEntry } from './types'

export interface CreateRoomPayload {
  hostName: string
  avatar?: string
  settings: RoomSettings
}

export interface CreateRoomResult {
  roomCode: string
  playerId: string
  timeline: TimelineEntry[]
}

export interface JoinRoomPayload {
  roomCode: string
  playerName: string
  avatar?: string
}

export interface JoinRoomResult {
  success: boolean
  error?: 'room_not_found' | 'room_full' | 'game_already_started'
  roomCode?: string
  playerId?: string
  players?: Player[]
  settings?: RoomSettings
  timeline?: TimelineEntry[]
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

export interface RejoinPayload {
  playerId: string
  roomCode: string
}

export type RejoinResult =
  | { success: false; error: 'room_not_found' | 'player_not_found' }
  | {
      success: true
      roomStatus: RoomStatus
      players: Player[]
      settings: RoomSettings
      gameState: GameState | null
    }

export interface StealResultPayload {
  success: boolean
  stealerId: string
  targetPlayerId: string
  correct: boolean
  targetWasCorrect: boolean  // true = active player placed correctly (steal was futile)
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
  'drag:update': (slot: number | null) => void
  'tokens:updated': (playerId: string, newTotal: number) => void
  'steal:open': (targetPlayerId: string) => void
  'steal:extended': (stealerId: string) => void
  'player:disconnected': (playerId: string) => void
  'player:reconnected': (playerId: string) => void
  'host:transferred': (newHostId: string) => void
  'game:reset': (players: Player[]) => void
}

export interface ClientToServerEvents {
  'room:create': (payload: CreateRoomPayload, cb: (result: CreateRoomResult) => void) => void
  'room:join': (payload: JoinRoomPayload, cb: (result: JoinRoomResult) => void) => void
  'room:rejoin': (payload: RejoinPayload, cb: (result: RejoinResult) => void) => void
  'room:leave': () => void
  'room:reset': (cb: (error?: string) => void) => void
  'game:start': (cb: (error?: string) => void) => void
  'song:guess': (payload: GuessPayload) => void
  'song:skip': (cb: (error?: string) => void) => void
  'card:place': (payload: PlacePayload, cb: (error?: string) => void) => void
  'steal:attempt': (payload: StealPayload, cb: (error?: string) => void) => void
  'steal:initiated': (stealerId: string) => void
  'audio:play': () => void
  'audio:pause': () => void
  'drag:move': (payload: { slot: number | null }) => void
}