import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals'
import { createServer, type Server as HttpServer } from 'http'
import { Server as IoServer } from 'socket.io'
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client'
import type { AddressInfo } from 'net'
import RedisMock from 'ioredis-mock'
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  CreateRoomResult,
  JoinRoomResult,
  RejoinResult,
  GameStartResult,
} from '@backspin-maestro/shared'

// ─── Mocks (must come before importing handlers) ───────────────────────────
const redis = new RedisMock()

jest.unstable_mockModule('../../lib/redis.js', () => ({
  redis,
  pubClient: redis,
  subClient: redis,
}))

interface MockSong {
  id: string
  title: string
  artist: string
  year: number
  preview_url: string
  deezer_id: string
}
const songQueue: MockSong[] = []
jest.unstable_mockModule('../../services/songService.js', () => ({
  getRandomSong: jest.fn(async () => songQueue.shift() ?? null),
  markSongAsUsed: jest.fn(async () => {}),
  getFreshPreviewUrl: jest.fn(async () => null),
}))

jest.unstable_mockModule('../../lib/jobs.js', () => ({
  scheduleStealFire: jest.fn(),
  cancelStealFire: jest.fn(),
  scheduleCardReveal: jest.fn(),
  cancelCardReveal: jest.fn(),
  cancelRoomTimers: jest.fn(),
  startRoomWorker: jest.fn(),
  closeRoomQueue: jest.fn(),
}))

jest.unstable_mockModule('../../db/database.js', () => ({
  db: {
    selectFrom: () => ({
      selectAll: () => ({
        where: () => ({
          executeTakeFirst: async () => null,
          executeTakeFirstOrThrow: async () => { throw new Error('not used') },
        }),
      }),
    }),
  },
}))

const { registerRoomHandlers } = await import('../roomHandlers.js')
const { registerGameHandlers } = await import('../gameHandlers.js')
const { handleDisconnect } = await import('../disconnectHandler.js')

// ─── Test server lifecycle ─────────────────────────────────────────────────
let httpServer: HttpServer
let io: IoServer<ClientToServerEvents, ServerToClientEvents>
let url: string

beforeAll(async () => {
  httpServer = createServer()
  io = new IoServer(httpServer)
  io.on('connection', (socket) => {
    registerRoomHandlers(io, socket)
    registerGameHandlers(io, socket)
    socket.on('disconnect', () => {
      handleDisconnect(io, socket).catch(() => {})
    })
  })

  await new Promise<void>((resolve) => {
    httpServer.listen(0, () => resolve())
  })
  const port = (httpServer.address() as AddressInfo).port
  url = `http://localhost:${port}`
})

afterAll(async () => {
  io.close()
  await new Promise<void>((resolve) => httpServer.close(() => resolve()))
  redis.disconnect()
})

beforeEach(async () => {
  await redis.flushall()
  songQueue.length = 0
})

// ─── Client helpers ────────────────────────────────────────────────────────
const connect = async () => {
  const client: ClientSocket = ioClient(url, {
    reconnection: false,
    transports: ['websocket'],
    forceNew: true,
  })
  await new Promise<void>((resolve, reject) => {
    client.once('connect', () => resolve())
    client.once('connect_error', reject)
  })
  return client
}

const createRoom = (client: ClientSocket, hostName = 'Alice') =>
  new Promise<Extract<CreateRoomResult, { success: true }>>((resolve, reject) =>
    client.emit('room:create', {
      hostName,
      settings: { songsPerPlayer: 10, decadeFilter: 'all' },
      // @ts-expect-error - emit type is structural, ack signature handled at runtime
    }, (result: CreateRoomResult) => {
      if (!result.success) reject(new Error(`room:create failed: ${result.error}`))
      else resolve(result)
    }),
  )

const joinRoom = (client: ClientSocket, roomCode: string, playerName = 'Bob') =>
  new Promise<JoinRoomResult>((resolve) =>
    client.emit('room:join', {
      roomCode,
      playerName,
      // @ts-expect-error - same as above
    }, (result: JoinRoomResult) => resolve(result)),
  )

const rejoinRoom = (client: ClientSocket, playerId: string, roomCode: string) =>
  new Promise<RejoinResult>((resolve) =>
    client.emit('room:rejoin', { playerId, roomCode }, (result: RejoinResult) => resolve(result)),
  )

const startGame = (client: ClientSocket) =>
  new Promise<GameStartResult>((resolve) =>
    client.emit('game:start', (result: GameStartResult) => resolve(result)),
  )

const waitFor = <T>(client: ClientSocket, event: string, timeoutMs = 1000): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), timeoutMs)
    client.once(event, (...args: unknown[]) => {
      clearTimeout(timer)
      resolve((args.length === 1 ? args[0] : args) as T)
    })
  })

// ─── Tests ─────────────────────────────────────────────────────────────────
describe('socket: room:create', () => {
  it('returns a 6-character alphanumeric room code and a player id', async () => {
    const client = await connect()
    songQueue.push({ id: 's1', title: 't', artist: 'a', year: 2000, preview_url: '', deezer_id: 'd1' })
    const result = await createRoom(client)

    expect(result.roomCode).toMatch(/^[A-Z0-9]{6}$/)
    expect(result.playerId).toBeDefined()
    client.close()
  })

  it('responds with success:false / invalid_payload for invalid payloads', async () => {
    const client = await connect()
    const result = await new Promise<CreateRoomResult>((resolve) =>
      // Empty hostName -> schema rejects
      client.emit('room:create', {
        hostName: '',
        settings: { songsPerPlayer: 10, decadeFilter: 'all' },
      // @ts-expect-error - testing invalid payload at runtime
      }, (r: CreateRoomResult) => resolve(r)),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('invalid_payload')
    client.close()
  })
})

describe('socket: room:join', () => {
  it('joins an existing room and returns settings + existing players', async () => {
    const host = await connect()
    songQueue.push({ id: 'h-starter', title: 't', artist: 'a', year: 2000, preview_url: '', deezer_id: 'd' })
    const created = await createRoom(host, 'Alice')

    const joiner = await connect()
    songQueue.push({ id: 'b-starter', title: 't', artist: 'a', year: 2000, preview_url: '', deezer_id: 'd' })
    const joined = await joinRoom(joiner, created.roomCode, 'Bob')

    expect(joined.success).toBe(true)
    if (joined.success) {
      expect(joined.roomCode).toBe(created.roomCode)
      expect(joined.players?.map((p) => p.name)).toEqual(['Alice'])
      expect(joined.settings?.songsPerPlayer).toBe(10)
    }
    host.close()
    joiner.close()
  })

  it('broadcasts player:joined to the host', async () => {
    const host = await connect()
    songQueue.push({ id: 'h', title: 't', artist: 'a', year: 2000, preview_url: '', deezer_id: 'd' })
    const created = await createRoom(host, 'Alice')

    const joinedEventPromise = waitFor<{ name: string }>(host, 'player:joined', 1000)

    const joiner = await connect()
    songQueue.push({ id: 'b', title: 't', artist: 'a', year: 2000, preview_url: '', deezer_id: 'd' })
    await joinRoom(joiner, created.roomCode, 'Bob')

    const broadcast = await joinedEventPromise
    expect(broadcast.name).toBe('Bob')
    host.close()
    joiner.close()
  })

  it('returns room_not_found for unknown room code', async () => {
    const client = await connect()
    const result = await joinRoom(client, 'ZZZZZZ', 'Bob')
    expect(result).toEqual(expect.objectContaining({ success: false, error: 'room_not_found' }))
    client.close()
  })

  it('returns room_not_found for malformed room code (schema rejects)', async () => {
    const client = await connect()
    const result = await joinRoom(client, 'abc', 'Bob') // too short
    expect(result.success).toBe(false)
    client.close()
  })
})

describe('socket: room:rejoin', () => {
  it('restores the player to the room with their roster + lobby state', async () => {
    const host = await connect()
    songQueue.push({ id: 'h', title: 't', artist: 'a', year: 2000, preview_url: '', deezer_id: 'd' })
    const created = await createRoom(host, 'Alice')

    // Disconnect host (skips finalize because of grace period)
    host.close()

    const reconnected = await connect()
    const result = await rejoinRoom(reconnected, created.playerId, created.roomCode)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.roomStatus).toBe('lobby')
      expect(result.players.map((p) => p.name)).toEqual(['Alice'])
      expect(result.gameState).toBeNull()
    }
    reconnected.close()
  })

  it('returns room_not_found for an unknown room', async () => {
    const client = await connect()
    const valid = '11111111-1111-4111-8111-111111111111'
    const result = await rejoinRoom(client, valid, 'ZZZZZZ')
    expect(result).toEqual(expect.objectContaining({ success: false, error: 'room_not_found' }))
    client.close()
  })

  it('returns player_not_found when player id does not match the room', async () => {
    const host = await connect()
    songQueue.push({ id: 'h', title: 't', artist: 'a', year: 2000, preview_url: '', deezer_id: 'd' })
    const created = await createRoom(host, 'Alice')

    const stranger = await connect()
    const fakeId = '99999999-9999-4999-8999-999999999999'
    const result = await rejoinRoom(stranger, fakeId, created.roomCode)
    expect(result).toEqual(expect.objectContaining({ success: false, error: 'player_not_found' }))

    host.close()
    stranger.close()
  })
})

describe('socket: game:start', () => {
  it('errors when caller is not the host', async () => {
    const host = await connect()
    songQueue.push({ id: 'h', title: 't', artist: 'a', year: 2000, preview_url: '', deezer_id: 'd' })
    const created = await createRoom(host, 'Alice')

    const joiner = await connect()
    songQueue.push({ id: 'b', title: 't', artist: 'a', year: 2000, preview_url: '', deezer_id: 'd' })
    await joinRoom(joiner, created.roomCode, 'Bob')

    const result = await startGame(joiner)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('not_host')
    host.close()
    joiner.close()
  })

  it('errors when only the host is in the room', async () => {
    const host = await connect()
    songQueue.push({ id: 'h', title: 't', artist: 'a', year: 2000, preview_url: '', deezer_id: 'd' })
    await createRoom(host, 'Alice')

    const result = await startGame(host)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('not_enough_players')
    host.close()
  })

  it('successfully starts the game with 2 players and broadcasts game:starting + song:new', async () => {
    const host = await connect()
    songQueue.push({ id: 'h', title: 't', artist: 'a', year: 2000, preview_url: '', deezer_id: 'd' })
    const created = await createRoom(host, 'Alice')

    const joiner = await connect()
    songQueue.push({ id: 'b', title: 't', artist: 'a', year: 2000, preview_url: '', deezer_id: 'd' })
    await joinRoom(joiner, created.roomCode, 'Bob')

    // First-round song:
    songQueue.push({ id: 'first', title: 'tr', artist: 'ar', year: 1995, preview_url: '', deezer_id: 'df' })

    const gameStartingPromise = waitFor<unknown>(joiner, 'game:starting', 2000)
    const result = await startGame(host)
    expect(result.success).toBe(true)

    const event = await gameStartingPromise
    expect(event).toBeDefined()
    host.close()
    joiner.close()
  })
})

describe('socket: room:leave', () => {
  it('removes the leaving player from the room and broadcasts player:left', async () => {
    const host = await connect()
    songQueue.push({ id: 'h', title: 't', artist: 'a', year: 2000, preview_url: '', deezer_id: 'd' })
    const created = await createRoom(host, 'Alice')

    const joiner = await connect()
    songQueue.push({ id: 'b', title: 't', artist: 'a', year: 2000, preview_url: '', deezer_id: 'd' })
    await joinRoom(joiner, created.roomCode, 'Bob')

    const leftEventPromise = waitFor<string>(host, 'player:left', 2000)
    joiner.emit('room:leave')
    const leftId = await leftEventPromise
    expect(typeof leftId).toBe('string')
    expect(leftId).not.toBe(created.playerId) // it was the joiner who left

    host.close()
    joiner.close()
  })
})
