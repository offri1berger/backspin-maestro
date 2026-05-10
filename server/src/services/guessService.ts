import { db } from '../db/database.js'
import { getGameState } from '../lib/gameCache.js'
import { getPlayerBySocketId, updatePlayerTokens } from '../lib/session.js'

const normalize = (str: string) =>
  str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '').trim()

export const handleGuessService = async (
  roomCode: string,
  socketId: string,
  artist: string,
  title: string
): Promise<{ correct: boolean; tokens: number; playerId: string } | { error: string }> => {
  const gameState = await getGameState(roomCode)
  if (!gameState) return { error: 'game_not_found' }
  if (gameState.currentPlayerId === null) return { error: 'no_current_player' }
  if (!gameState.currentSongId) return { error: 'no_current_song' }

  const player = await getPlayerBySocketId(socketId)
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

  if (!correct) return { correct: false, tokens: player.tokens, playerId: player.id }

  const newTokens = player.tokens + 1
  await updatePlayerTokens(player.id, newTokens)

  return { correct: true, tokens: newTokens, playerId: player.id }
}
