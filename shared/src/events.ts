import { z } from 'zod'
import { GamePhase } from './enums.js'
import type { RoomStatus } from './enums.js'
import type { Player, Song, RoomSettings, GameState, TimelineEntry } from './types.js'
import {
  CreateRoomPayloadSchema,
  JoinRoomPayloadSchema,
  RejoinPayloadSchema,
  PlacePayloadSchema,
  GuessPayloadSchema,
  StealPayloadSchema,
  DragMovePayloadSchema,
  KickPayloadSchema,
} from './schemas.js'

export type CreateRoomPayload = z.infer<typeof CreateRoomPayloadSchema>
export type JoinRoomPayload = z.infer<typeof JoinRoomPayloadSchema>
export type RejoinPayload = z.infer<typeof RejoinPayloadSchema>
export type PlacePayload = z.infer<typeof PlacePayloadSchema>
export type GuessPayload = z.infer<typeof GuessPayloadSchema>
export type StealPayload = z.infer<typeof StealPayloadSchema>
export type DragMovePayload = z.infer<typeof DragMovePayloadSchema>
export type KickPayload = z.infer<typeof KickPayloadSchema>

export type CreateRoomResult =
  | { success: true; roomCode: string; playerId: string; timeline: TimelineEntry[] }
  | { success: false; error: 'invalid_payload' | 'rate_limited' | 'server_error' }

export interface JoinRoomResult {
  success: boolean
  error?: 'room_not_found' | 'room_full' | 'game_already_started' | 'invalid_payload' | 'rate_limited' | 'server_error'
  roomCode?: string
  playerId?: string
  players?: Player[]
  settings?: RoomSettings
  timeline?: TimelineEntry[]
}

export interface PlacementResultPayload {
  playerId: string
  correct: boolean
  song: Song
  correctPosition: number
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
  'steal:open': (targetPlayerId: string, originalPosition: number) => void
  'steal:extended': (stealerId: string) => void
  'player:disconnected': (playerId: string) => void
  'player:reconnected': (playerId: string) => void
  'host:transferred': (newHostId: string) => void
  'game:reset': (players: Player[]) => void
  'player:kicked': (playerId: string) => void
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
  'steal:initiated': () => void
  'audio:play': () => void
  'audio:pause': () => void
  'drag:move': (payload: DragMovePayload) => void
  'conductor:kick': (payload: KickPayload, cb: (error?: string) => void) => void
}
