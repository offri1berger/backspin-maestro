import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import type { ServerToClientEvents, ClientToServerEvents } from '@hitster/shared'
import { registerRoomHandlers } from './socket/roomHandlers.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: process.env.CLIENT_URL ?? 'http://localhost:5173' },
})

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

io.on('connection', (socket) => {
  console.log('client connected:', socket.id)

  registerRoomHandlers(io, socket)

  socket.on('disconnect', () => {
    console.log('client disconnected:', socket.id)
  })
})

const PORT = process.env.PORT ?? 3001
httpServer.listen(PORT, () => console.log(`server running on port ${PORT}`))