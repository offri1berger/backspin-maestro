import { randomUUID } from 'crypto'
import { redis } from './redis.js'

export const generateRoomCode = async (): Promise<string> => {
  for (let i = 0; i < 10; i++) {
    const code = randomUUID().slice(0, 6).toUpperCase()
    const exists = await redis.exists(`room:${code}`)
    if (!exists) return code
  }
  throw new Error('Could not generate unique room code after 10 attempts')
}
