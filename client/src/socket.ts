import { io, Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '@hitster/shared'

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
  autoConnect: false,
})

export default socket