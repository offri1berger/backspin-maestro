import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import type { ServerToClientEvents, ClientToServerEvents } from '@hitster/shared'
import { registerRoomHandlers } from './socket/roomHandlers.js'
import { registerGameHandlers } from './socket/gameHandlers.js'
import { handleDisconnect } from './socket/disconnectHandler.js'
import { clearAllLimits } from './lib/rateLimit.js'
import { db } from './db/database.js'
import { redis } from './lib/redis.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: process.env.CLIENT_URL ?? 'http://localhost:5173' },
})

app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173' }))
app.use(express.json())

app.get('/health', async (_req, res) => {
  try {
    await db.selectFrom('songs').select('id').limit(1).execute()
    await redis.ping()
    res.json({ ok: true })
  } catch (err) {
    console.error('health check failed', err)
    res.status(503).json({ ok: false })
  }
})

io.on('connection', (socket) => {
  console.log('client connected:', socket.id)

  registerRoomHandlers(io, socket)
  registerGameHandlers(io, socket)

  socket.on('disconnect', async () => {
    console.log('client disconnected:', socket.id)
    clearAllLimits(socket.id)
    try { await handleDisconnect(io, socket) } catch (err) { console.error('disconnect error', err) }
  })
})

const PORT = process.env.PORT ?? 3001
const server = httpServer.listen(PORT, () => console.log(`server running on port ${PORT}`))

const shutdown = () => {
  server.close(async () => {
    await io.close()
    await db.destroy()
    redis.disconnect()
    process.exit(0)
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)