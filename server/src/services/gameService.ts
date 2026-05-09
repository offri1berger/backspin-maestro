import { getPlayersByRoomId, updateTurnOrder } from '../db/queries/players.js'
import { updateRoomStatus, getRoomByCode } from '../db/queries/rooms.js'
import { getFreshPreviewUrl, getRandomSong, markSongAsUsed } from './songService.js'
import { getGameState, setGameState } from '../lib/gameCache.js'
import type { Player, Song, GameState } from '@hitster/shared'
import { db } from '../db/database.js'

export const startGameService = async (
  roomCode: string,
  hostSocketId: string
): Promise<{ players: Player[], song: Song | null, gameState: GameState } | { error: string }> => {
  const room = await getRoomByCode(roomCode)
  if (!room) return { error: 'room_not_found' }
  if (room.status !== 'lobby') return { error: 'game_already_started' }

  const dbPlayers = await getPlayersByRoomId(room.id)

  const host = dbPlayers.find((p) => p.socket_id === hostSocketId)
  if (!host?.is_host) return { error: 'not_host' }
  if (dbPlayers.length < 2) return { error: 'not_enough_players' }

  const shuffled = [...dbPlayers]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  await Promise.all(shuffled.map((p, i) => updateTurnOrder(p.id, i)))
  await updateRoomStatus(room.id, 'playing')

  const firstPlayer = shuffled[0]
  const phaseStartedAt = new Date().toISOString()

  const players: Player[] = shuffled.map((p, i) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar ?? undefined,
    tokens: p.tokens,
    isHost: p.is_host,
    turnOrder: i,
    timeline: [],
  }))

  const dbSong = await getRandomSong(room.id)
  const songForClient: Song | null = dbSong ? {
    id: dbSong.id,
    title: dbSong.title,
    artist: dbSong.artist,
    year: dbSong.year,
    previewUrl: (await getFreshPreviewUrl(dbSong.deezer_id)) ?? dbSong.preview_url,
    deezerTrackId: dbSong.deezer_id,
  } : null

  if (dbSong) await markSongAsUsed(room.id, dbSong.id)

  await setGameState(roomCode, {
    phase: 'song_phase',
    currentPlayerId: firstPlayer.id,
    currentSongId: dbSong?.id ?? null,
    roundNumber: 1,
    phaseStartedAt,
  })

  const gameState: GameState = {
    phase: 'song_phase',
    currentPlayerId: firstPlayer.id,
    currentSong: songForClient,
    roundNumber: 1,
    phaseStartedAt,
  }

  return { players, song: songForClient, gameState }
}

export const nextTurnService = async (
  roomCode: string
): Promise<{ nextPlayerId: string, song: Song } | { error: string }> => {
  const gameState = await getGameState(roomCode)
  if (!gameState) return { error: 'game_not_found' }

  const room = await getRoomByCode(roomCode)
  if (!room) return { error: 'room_not_found' }

  const players = await getPlayersByRoomId(room.id)
  const sorted = players.sort((a, b) => (a.turn_order ?? 0) - (b.turn_order ?? 0))

  const currentIndex = sorted.findIndex((p) => p.id === gameState.currentPlayerId)
  const nextPlayer = sorted[(currentIndex + 1) % sorted.length]

  const song = await getRandomSong(room.id)
  if (!song) return { error: 'no_songs_left' }

  await markSongAsUsed(room.id, song.id)
  const freshPreviewUrl = await getFreshPreviewUrl(song.deezer_id)

  await setGameState(roomCode, {
    phase: 'song_phase',
    currentPlayerId: nextPlayer.id,
    currentSongId: song.id,
    roundNumber: gameState.roundNumber + 1,
    phaseStartedAt: new Date().toISOString(),
  })

  return {
    nextPlayerId: nextPlayer.id,
    song: {
      id: song.id,
      title: song.title,
      artist: song.artist,
      year: song.year,
      previewUrl: freshPreviewUrl ?? song.preview_url,
      deezerTrackId: song.deezer_id,
    },
  }
}

export const checkWinCondition = async (
  playerId: string,
  roomId: string,
  songsPerPlayer: number
): Promise<boolean> => {
  const count = await db
    .selectFrom('timeline_entries')
    .select(db.fn.count('id').as('count'))
    .where('player_id', '=', playerId)
    .executeTakeFirstOrThrow()

  return Number(count.count) >= songsPerPlayer
}