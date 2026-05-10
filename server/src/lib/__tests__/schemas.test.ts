import { describe, it, expect } from '@jest/globals'
import {
  CreateRoomPayloadSchema,
  JoinRoomPayloadSchema,
  RejoinPayloadSchema,
  PlacePayloadSchema,
  GuessPayloadSchema,
  StealPayloadSchema,
  RoomSettingsSchema,
  DragMovePayloadSchema,
  MIN_SONGS_PER_PLAYER,
  MAX_SONGS_PER_PLAYER,
  MAX_NAME_LENGTH,
  MAX_GUESS_LENGTH,
  ROOM_CODE_LENGTH,
} from '@hitster/shared'

const validUuid = '11111111-1111-4111-8111-111111111111'
const validRoomCode = 'ABC123'

describe('RoomSettingsSchema', () => {
  it('accepts valid bounds', () => {
    expect(RoomSettingsSchema.safeParse({ songsPerPlayer: 10, decadeFilter: 'all' }).success).toBe(true)
    expect(RoomSettingsSchema.safeParse({ songsPerPlayer: MIN_SONGS_PER_PLAYER, decadeFilter: '80s' }).success).toBe(true)
    expect(RoomSettingsSchema.safeParse({ songsPerPlayer: MAX_SONGS_PER_PLAYER, decadeFilter: '90s' }).success).toBe(true)
  })

  it('rejects songsPerPlayer below the minimum', () => {
    expect(RoomSettingsSchema.safeParse({ songsPerPlayer: MIN_SONGS_PER_PLAYER - 1, decadeFilter: 'all' }).success).toBe(false)
  })

  it('rejects songsPerPlayer above the maximum', () => {
    expect(RoomSettingsSchema.safeParse({ songsPerPlayer: MAX_SONGS_PER_PLAYER + 1, decadeFilter: 'all' }).success).toBe(false)
  })

  it('rejects non-integer songsPerPlayer', () => {
    expect(RoomSettingsSchema.safeParse({ songsPerPlayer: 10.5, decadeFilter: 'all' }).success).toBe(false)
  })

  it('rejects unknown decade filters', () => {
    expect(RoomSettingsSchema.safeParse({ songsPerPlayer: 10, decadeFilter: '50s' }).success).toBe(false)
    expect(RoomSettingsSchema.safeParse({ songsPerPlayer: 10, decadeFilter: 'ALL' }).success).toBe(false)
  })
})

describe('CreateRoomPayloadSchema', () => {
  const valid = {
    hostName: 'Alice',
    settings: { songsPerPlayer: 10, decadeFilter: 'all' as const },
  }

  it('accepts a minimal valid payload', () => {
    expect(CreateRoomPayloadSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts an optional avatar', () => {
    expect(CreateRoomPayloadSchema.safeParse({ ...valid, avatar: 'https://x/y.png' }).success).toBe(true)
  })

  it('rejects empty host name', () => {
    expect(CreateRoomPayloadSchema.safeParse({ ...valid, hostName: '' }).success).toBe(false)
  })

  it('rejects whitespace-only host name', () => {
    expect(CreateRoomPayloadSchema.safeParse({ ...valid, hostName: '   ' }).success).toBe(false)
  })

  it('trims host name', () => {
    const result = CreateRoomPayloadSchema.safeParse({ ...valid, hostName: '  Alice  ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.hostName).toBe('Alice')
  })

  it('rejects host name longer than the limit', () => {
    expect(CreateRoomPayloadSchema.safeParse({ ...valid, hostName: 'a'.repeat(MAX_NAME_LENGTH + 1) }).success).toBe(false)
  })

  it('rejects when settings are missing', () => {
    expect(CreateRoomPayloadSchema.safeParse({ hostName: 'Alice' }).success).toBe(false)
  })

  it('rejects unknown decade filter inside settings', () => {
    expect(CreateRoomPayloadSchema.safeParse({
      hostName: 'Alice',
      settings: { songsPerPlayer: 10, decadeFilter: 'bogus' },
    }).success).toBe(false)
  })
})

describe('JoinRoomPayloadSchema', () => {
  it('accepts valid input and uppercases the room code', () => {
    const result = JoinRoomPayloadSchema.safeParse({ roomCode: 'abc123', playerName: 'Bob' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.roomCode).toBe('ABC123')
  })

  it('rejects room codes that are not exactly the right length', () => {
    expect(JoinRoomPayloadSchema.safeParse({ roomCode: 'ABC12', playerName: 'Bob' }).success).toBe(false)
    expect(JoinRoomPayloadSchema.safeParse({ roomCode: 'ABC1234', playerName: 'Bob' }).success).toBe(false)
    expect(JoinRoomPayloadSchema.safeParse({ roomCode: 'A'.repeat(ROOM_CODE_LENGTH + 1), playerName: 'Bob' }).success).toBe(false)
  })

  it('rejects room codes with non-alphanumeric characters', () => {
    expect(JoinRoomPayloadSchema.safeParse({ roomCode: 'ABC-12', playerName: 'Bob' }).success).toBe(false)
    expect(JoinRoomPayloadSchema.safeParse({ roomCode: 'AB C123', playerName: 'Bob' }).success).toBe(false)
  })

  it('rejects empty player name', () => {
    expect(JoinRoomPayloadSchema.safeParse({ roomCode: validRoomCode, playerName: '' }).success).toBe(false)
  })

  it('trims player name', () => {
    const result = JoinRoomPayloadSchema.safeParse({ roomCode: validRoomCode, playerName: '  Bob  ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.playerName).toBe('Bob')
  })
})

describe('RejoinPayloadSchema', () => {
  it('accepts a valid uuid + room code', () => {
    expect(RejoinPayloadSchema.safeParse({ playerId: validUuid, roomCode: validRoomCode }).success).toBe(true)
  })

  it('rejects a non-uuid player id', () => {
    expect(RejoinPayloadSchema.safeParse({ playerId: 'not-a-uuid', roomCode: validRoomCode }).success).toBe(false)
  })

  it('rejects an invalid room code', () => {
    expect(RejoinPayloadSchema.safeParse({ playerId: validUuid, roomCode: 'short' }).success).toBe(false)
  })
})

describe('PlacePayloadSchema', () => {
  it('accepts position 0', () => {
    expect(PlacePayloadSchema.safeParse({ position: 0 }).success).toBe(true)
  })

  it('accepts large positive integers (server-side bounds-check is the gate)', () => {
    expect(PlacePayloadSchema.safeParse({ position: 999 }).success).toBe(true)
  })

  it('rejects negative positions', () => {
    expect(PlacePayloadSchema.safeParse({ position: -1 }).success).toBe(false)
  })

  it('rejects non-integer positions', () => {
    expect(PlacePayloadSchema.safeParse({ position: 1.5 }).success).toBe(false)
  })

  it('rejects non-numbers', () => {
    expect(PlacePayloadSchema.safeParse({ position: '0' }).success).toBe(false)
  })
})

describe('GuessPayloadSchema', () => {
  it('accepts artist + title', () => {
    expect(GuessPayloadSchema.safeParse({ artist: 'Beatles', title: 'Hey Jude' }).success).toBe(true)
  })

  it('rejects empty artist or title', () => {
    expect(GuessPayloadSchema.safeParse({ artist: '', title: 'Hey Jude' }).success).toBe(false)
    expect(GuessPayloadSchema.safeParse({ artist: 'Beatles', title: '' }).success).toBe(false)
  })

  it('rejects whitespace-only inputs', () => {
    expect(GuessPayloadSchema.safeParse({ artist: '   ', title: 'Hey Jude' }).success).toBe(false)
  })

  it('rejects guesses longer than the limit', () => {
    expect(GuessPayloadSchema.safeParse({
      artist: 'a'.repeat(MAX_GUESS_LENGTH + 1),
      title: 'Hey Jude',
    }).success).toBe(false)
  })
})

describe('StealPayloadSchema', () => {
  it('accepts a valid uuid + position', () => {
    expect(StealPayloadSchema.safeParse({ targetPlayerId: validUuid, position: 2 }).success).toBe(true)
  })

  it('rejects non-uuid target player id', () => {
    expect(StealPayloadSchema.safeParse({ targetPlayerId: 'p1', position: 2 }).success).toBe(false)
  })

  it('rejects negative positions', () => {
    expect(StealPayloadSchema.safeParse({ targetPlayerId: validUuid, position: -1 }).success).toBe(false)
  })
})

describe('DragMovePayloadSchema', () => {
  it('accepts a non-negative integer slot', () => {
    expect(DragMovePayloadSchema.safeParse({ slot: 0 }).success).toBe(true)
    expect(DragMovePayloadSchema.safeParse({ slot: 5 }).success).toBe(true)
  })

  it('accepts null (drag released)', () => {
    expect(DragMovePayloadSchema.safeParse({ slot: null }).success).toBe(true)
  })

  it('rejects negative slot', () => {
    expect(DragMovePayloadSchema.safeParse({ slot: -1 }).success).toBe(false)
  })

  it('rejects non-integer slot', () => {
    expect(DragMovePayloadSchema.safeParse({ slot: 1.5 }).success).toBe(false)
  })
})
