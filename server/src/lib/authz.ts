import { getPlayerBySocketId, type SessionPlayer } from './session.js'

type ConductorAuthOk = {
  ok: true
  player: SessionPlayer
  roomCode: string
}

type ConductorAuthErr = {
  ok: false
  error: 'player_not_found' | 'not_in_room' | 'not_conductor'
}

/**
 * Resolves the socket's player and asserts they hold the Conductor role
 * (currently aliased to `isHost`) for the room they're in.
 * Centralized so every Conductor-gated handler shares one auth path.
 */
export const requireConductor = async (
  socketId: string,
): Promise<ConductorAuthOk | ConductorAuthErr> => {
  const player = await getPlayerBySocketId(socketId)
  if (!player) return { ok: false, error: 'player_not_found' }
  if (!player.roomCode) return { ok: false, error: 'not_in_room' }
  if (!player.isHost) return { ok: false, error: 'not_conductor' }
  return { ok: true, player, roomCode: player.roomCode }
}
