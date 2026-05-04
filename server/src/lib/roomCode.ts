import { randomUUID } from 'crypto'

export const generateRoomCode = (): string =>
  randomUUID().slice(0, 6).toUpperCase()