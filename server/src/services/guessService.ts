import { db } from '../db/database.js'
import { getGameState, setGameState } from '../lib/gameCache.js'

const normalize = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9\u0590-\u05ff]/g, '').trim()

export const handleGuessService = async (
  roomCode: string,
  socketId: string,
  artist: string,
  title: string
): Promise<{ correct: boolean; tokens: number } | { error: string }> => {
  const gameState = await getGameState(roomCode)
  if (!gameState) return { error: 'game_not_found' }
  if (gameState.currentPlayerId === null) return { error: 'no_current_player' }
  if (!gameState.currentSongId) return { error: 'no_current_song' }

  const player = await db
    .selectFrom('players')
    .selectAll()
    .where('socket_id', '=', socketId)
    .executeTakeFirst()

  if (!player) return { error: 'player_not_found' }
  if (player.id !== gameState.currentPlayerId) return { error: 'not_your_turn' }

  const song = await db
    .selectFrom('songs')
    .selectAll()
    .where('id', '=', gameState.currentSongId)
    .executeTakeFirstOrThrow()

  const artistMatch = normalize(song.artist).includes(normalize(artist))
  const titleMatch = normalize(song.title).includes(normalize(title))
  const correct = artistMatch && titleMatch

  if (!correct) return { correct: false, tokens: player.tokens }

  const updated = await db
    .updateTable('players')
    .set({ tokens: player.tokens + 1 })
    .where('id', '=', player.id)
    .returningAll()
    .executeTakeFirstOrThrow()

  return { correct: true, tokens: updated.tokens }
}