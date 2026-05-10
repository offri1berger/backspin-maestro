import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')

// Dedicated connections for the socket.io adapter's pub/sub. ioredis clients in
// subscriber mode can't run normal commands, so they must be separate from the
// main `redis` client used for game state.
export const pubClient = redis.duplicate()
export const subClient = redis.duplicate()