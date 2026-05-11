import { z } from 'zod'

export const ROOM_CODE_LENGTH = 6
export const MAX_NAME_LENGTH = 30
export const MAX_AVATAR_LENGTH = 200
export const MAX_GUESS_LENGTH = 100
export const MIN_SONGS_PER_PLAYER = 3
export const MAX_SONGS_PER_PLAYER = 20

const trimmedNonEmpty = (max: number) => z.string().trim().min(1).max(max)

const RoomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(ROOM_CODE_LENGTH)
  .regex(/^[A-Z0-9]+$/)

const PlayerIdSchema = z.string().uuid()

const PositionSchema = z.number().int().min(0)

const DecadeSchema = z.enum(['all', '60s', '70s', '80s', '90s', '00s', '10s'])

const AvatarSchema = z.string().max(MAX_AVATAR_LENGTH).optional()

export const RoomSettingsSchema = z.object({
  songsPerPlayer: z
    .number()
    .int()
    .min(MIN_SONGS_PER_PLAYER)
    .max(MAX_SONGS_PER_PLAYER),
  decadeFilter: DecadeSchema,
})

export const CreateRoomPayloadSchema = z.object({
  hostName: trimmedNonEmpty(MAX_NAME_LENGTH),
  avatar: AvatarSchema,
  settings: RoomSettingsSchema,
})

export const JoinRoomPayloadSchema = z.object({
  roomCode: RoomCodeSchema,
  playerName: trimmedNonEmpty(MAX_NAME_LENGTH),
  avatar: AvatarSchema,
})

export const RejoinPayloadSchema = z.object({
  playerId: PlayerIdSchema,
  roomCode: RoomCodeSchema,
})

export const PlacePayloadSchema = z.object({
  position: PositionSchema,
})

export const GuessPayloadSchema = z.object({
  artist: trimmedNonEmpty(MAX_GUESS_LENGTH),
  title: trimmedNonEmpty(MAX_GUESS_LENGTH),
})

export const StealPayloadSchema = z.object({
  targetPlayerId: PlayerIdSchema,
  position: PositionSchema,
})

export const DragMovePayloadSchema = z.object({
  slot: z.number().int().min(0).nullable(),
})

export const KickPayloadSchema = z.object({
  playerId: PlayerIdSchema,
})
