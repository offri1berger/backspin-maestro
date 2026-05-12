import { db } from '../db/database.js'
import { getGameState, setGameState } from '../lib/gameCache.js'
import { getTimeline, addToTimeline } from '../lib/session.js'
import { toSong } from './mappers.js'
import type { Song } from '@hitster/shared'

export const validatePlacement = async (
  roomCode: string,
  playerId: string,
  position: number
): Promise<{ correct: boolean; correctPosition: number; song: Song } | { error: string }> => {
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

  if (correct) {
    await addToTimeline(playerId, song)
  }

  await setGameState(roomCode, {
    ...gameState,
    phase: 'steal_window',
    phaseStartedAt: new Date().toISOString(),
  })

  return { correct, correctPosition, song }
}
