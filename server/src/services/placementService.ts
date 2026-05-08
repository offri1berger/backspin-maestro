import { sql } from 'kysely';
import { db } from '../db/database.js'
import { getGameState, setGameState } from '../lib/gameCache.js'

export const validatePlacement = async (
  roomCode: string,
  playerId: string,
  position: number
): Promise<{ correct: boolean; correctPosition: number } | { error: string }> => {
  const gameState = await getGameState(roomCode)
  if (!gameState) return { error: 'game_not_found' }
  if (gameState.currentPlayerId !== playerId) return { error: 'not_your_turn' }
  if (!gameState.currentSongId) return { error: 'no_current_song' }

  const song = await db
    .selectFrom('songs')
    .selectAll()
    .where('id', '=', gameState.currentSongId)
    .executeTakeFirstOrThrow()

  const timeline = await db
    .selectFrom('timeline_entries')
    .innerJoin('songs', 'songs.id', 'timeline_entries.song_id')
    .select(['timeline_entries.position', 'songs.year'])
    .where('timeline_entries.player_id', '=', playerId)
    .orderBy('timeline_entries.position', 'asc')
    .execute()

  const prevSong = timeline[position - 1]
  const nextSong = timeline[position]

  const prevOk = !prevSong || prevSong.year <= song.year
  const nextOk = !nextSong || nextSong.year >= song.year
  const correct = prevOk && nextOk

  const correctPosition = timeline.findIndex((t) => t.year > song.year)
  const finalCorrectPosition = correctPosition === -1 ? timeline.length : correctPosition

  if (correct) {
  await db.transaction().execute(async (trx) => {
    const existing = await trx
      .selectFrom('timeline_entries')
      .select(['id', 'position'])
      .where('player_id', '=', playerId)
      .where('position', '>=', position)
      .orderBy('position', 'desc')
      .execute()

    for (const entry of existing) {
      await trx
        .updateTable('timeline_entries')
        .set({ position: entry.position + 1 })
        .where('id', '=', entry.id)
        .execute()
    }

    await trx.insertInto('timeline_entries').values({
      player_id: playerId,
      song_id: song.id,
      position,
    }).execute()
  })
}

  await setGameState(roomCode, {
    ...gameState,
    phase: 'steal_window',
    phaseStartedAt: new Date().toISOString(),
  })

  return { correct, correctPosition: finalCorrectPosition }
}