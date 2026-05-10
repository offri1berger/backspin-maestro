import type { PlacementResultPayload } from '@hitster/shared'

export const pendingResults = new Map<string, PlacementResultPayload>()
export const stealTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
export const resolvedRooms = new Set<string>()

export const cleanupRoomState = (roomCode: string) => {
  const t = stealTimeouts.get(roomCode)
  if (t) clearTimeout(t)
  stealTimeouts.delete(roomCode)
  pendingResults.delete(roomCode)
  resolvedRooms.delete(roomCode)
}

export const cancelRoomStealTimeout = (roomCode: string) => {
  const t = stealTimeouts.get(roomCode)
  if (t) { clearTimeout(t); stealTimeouts.delete(roomCode) }
  resolvedRooms.add(roomCode)
}
