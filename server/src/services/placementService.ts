import { db } from '../db/database.js'
import { getGameState, setGameState } from '../lib/gameCache.js'
import { getTimeline, addToTimeline } from '../lib/session.js'
import { toSong } from './mappers.js'
import type { Song } from '@backspin-maestro/shared'

export type PlacementEvaluation = {
  correct: boolean
  correctPosition: number
  song: Song
}

export type PlacementError =
  | 'game_not_found'
  | 'wrong_phase'
  | 'not_your_turn'
  | 'no_current_song'
  | 'invalid_position'

// Pure-ish: reads game state + timeline, computes correctness, returns the
// evaluation. No writes — safe to call in tests without arranging cleanup.
export const evaluatePlacement = async (
  roomCode: string,
  playerId: string,
  position: number,
): Promise<PlacementEvaluation | { error: PlacementError }> => {
  const gameState = await getGameState(roomCode)
  if (!gameState) return { error: 'game_not_found' }
  if (gameState.phase !== 'song_phase') return { error: 'wrong_phase' }
  if (gameState.currentPlayerId !== playerId) return { error: 'not_your_turn' }
  if (!gameState.currentSongId) return { error: 'no_current_song' }

  const dbSong = await db
    .selectFrom('songs')
    .selectAll()
    .where('id', '=', gameState.currentSongId)
    .executeTakeFirstOrThrow()

  const song = toSong(dbSong)
  const timeline = await getTimeline(playerId)

  if (position > timeline.length) return { error: 'invalid_position' }

  const prevEntry = timeline[position - 1]
  const nextEntry = timeline[position]
  const prevOk = !prevEntry || prevEntry.song.year <= song.year
  const nextOk = !nextEntry || nextEntry.song.year >= song.year
  const correct = prevOk && nextOk

  const correctIdx = timeline.findIndex((t) => t.song.year > song.year)
  const correctPosition = correctIdx === -1 ? timeline.length : correctIdx

  return { correct, correctPosition, song }
}

// Side effects: append to the player's timeline (if correct) and advance the
// room into the steal window. Caller is expected to have validated first via
// evaluatePlacement on the same (roomCode, playerId) snapshot.
export const applyPlacement = async (
  roomCode: string,
  playerId: string,
  evaluation: PlacementEvaluation,
): Promise<void> => {
  const gameState = await getGameState(roomCode)
  if (!gameState) return

  if (evaluation.correct) {
    await addToTimeline(playerId, evaluation.song)
  }

  await setGameState(roomCode, {
    ...gameState,
    phase: 'steal_window',
    phaseStartedAt: new Date().toISOString(),
  })
}

// Back-compat facade: evaluate then (if no error) apply.
export const validatePlacement = async (
  roomCode: string,
  playerId: string,
  position: number,
): Promise<PlacementEvaluation | { error: PlacementError }> => {
  const evaluation = await evaluatePlacement(roomCode, playerId, position)
  if ('error' in evaluation) return evaluation
  await applyPlacement(roomCode, playerId, evaluation)
  return evaluation
}
