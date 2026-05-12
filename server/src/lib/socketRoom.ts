import type { Socket } from 'socket.io'
/**
 *  Get the room code of the room the socket is currently in, or null if not in any room.
 *  Assumes each socket is in at most one room (besides its own default room).  
 * @param socket The socket to check  
 * @returns The room code or null if not in any room
 */
export const getSocketRoomCode = (socket: Socket): string | null => { 
  for (const room of socket.rooms) if (room !== socket.id) return room
  return null
}
