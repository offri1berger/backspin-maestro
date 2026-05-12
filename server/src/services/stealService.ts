import type { PlacementResultPayload, Song } from '@backspin-maestro/shared'
import { db } from '../db/database.js'
import { getGameState, setGameState } from '../lib/gameCache.js'
import {
  addToTimeline,
  getPlayerBySocketId,
  getSessionPlayer,
  getTimeline,
  updatePlayerTokens,
} from '../lib/session.js'
import {
  cancelStealFire,
} from '../lib/jobs.js'
import {
  clearPending,
  getPending,
  isResolved,
  tryClaimResolution,
} from '../lib/roomTimeouts.js'
import { toSong } from './mappers.js'

export type StealError =
  | 'game_not_found'
  | 'no_current_song'
  | 'steal_window_closed'
  | 'no_pending_result'
  | 'player_not_found'
  | 'target_not_found'
  | 'cannot_steal_from_self'
  | 'insufficient_tokens'

export type StealOutcome =
  | { ok: false; error: StealError }
  | {
      ok: true
      stealerId: string
      targetPlayerId: string
      stealCorrect: boolean
      pending: PlacementResultPayload
      newStealerTokens: number
      song: Song
    }

// Encapsulates the full steal flow: validate, claim resolution atomically,
// deduct token, evaluate the steal, mutate timeline + phase, clear pending.
// Emits are left to the handler — this service is pure I/O against Redis + DB.
export const attemptSteal = async (
  roomCode: string,
  stealerSocketId: string,
  targetPlayerId: string,
  position: number,
): Promise<StealOutcome> => {
  const gameState = await getGameState(roomCode)
  if (!gameState) return { ok: false, error: 'game_not_found' }
  if (!gameState.currentSongId) return { ok: false, error: 'no_current_song' }

  if (await isResolved(roomCode)) return { ok: false, error: 'steal_window_closed' }

  const pending = await getPending(roomCode)
  if (!pending) return { ok: false, error: 'no_pending_result' }

  const stealer = await getPlayerBySocketId(stealerSocketId)
  if (!stealer) return { ok: false, error: 'player_not_found' }

  const targetPlayer = await getSessionPlayer(targetPlayerId)
  if (!targetPlayer || targetPlayer.roomCode !== roomCode) {
    return { ok: false, error: 'target_not_found' }
  }
  if (stealer.id === targetPlayerId) return { ok: false, error: 'cannot_steal_from_self' }
  if (stealer.tokens < 1) return { ok: false, error: 'insufficient_tokens' }

  if (!(await tryClaimResolution(roomCode))) {
    return { ok: false, error: 'steal_window_closed' }
  }
  await cancelStealFire(roomCode)

  const dbSong = await db
    .selectFrom('songs')
    .selectAll()
    .where('id', '=', gameState.currentSongId)
    .executeTakeFirstOrThrow()
  const song = toSong(dbSong)

  const newStealerTokens = stealer.tokens - 1
  await updatePlayerTokens(stealer.id, newStealerTokens)

  let stealCorrect = false
  if (!pending.correct) {
    const targetTimeline = await getTimeline(targetPlayerId)
    const prevOk = !targetTimeline[position - 1] || targetTimeline[position - 1].song.year <= song.year
    const nextOk = !targetTimeline[position] || targetTimeline[position].song.year >= song.year
    stealCorrect = prevOk && nextOk
    if (stealCorrect) await addToTimeline(stealer.id, song)
  }

  await setGameState(roomCode, { ...gameState, phase: 'song_phase' })
  await clearPending(roomCode)

  return {
    ok: true,
    stealerId: stealer.id,
    targetPlayerId,
    stealCorrect,
    pending,
    newStealerTokens,
    song,
  }
}
