import { getPlayersByRoomId, updateTurnOrder } from '../db/queries/players.js'
import { updateRoomStatus, getRoomByCode } from '../db/queries/rooms.js'
import { getFreshPreviewUrl, getRandomSong, markSongAsUsed } from './songService.js'
import { setGameState } from '../lib/gameCache.js'
import type { Player, Song } from '@hitster/shared'

export const startGameService = async (
  roomCode: string,
  hostSocketId: string
): Promise<{ players: Player[], song: Song | null } | { error: string }> => {
  const room = await getRoomByCode(roomCode)
  if (!room) return { error: 'room_not_found' }
  if (room.status !== 'lobby') return { error: 'game_already_started' }

  const dbPlayers = await getPlayersByRoomId(room.id)

  const host = dbPlayers.find((p) => p.socket_id === hostSocketId)
  if (!host?.is_host) return { error: 'not_host' }
  if (dbPlayers.length < 2) return { error: 'not_enough_players' }

  const shuffled = [...dbPlayers].sort(() => Math.random() - 0.5)

  await Promise.all(shuffled.map((p, i) => updateTurnOrder(p.id, i)))

  await updateRoomStatus(room.id, 'playing')

  const firstPlayer = shuffled[0]

  const players: Player[] = shuffled.map((p, i) => ({
    id: p.id,
    name: p.name,
    tokens: p.tokens,
    isHost: p.is_host,
    turnOrder: i,
    timeline: [],
  }))

  const song = await getRandomSong(room.id)

  if (!song) {
    await setGameState(roomCode, {
      phase: 'song_phase',
      currentPlayerId: firstPlayer.id,
      currentSongId: null,
      roundNumber: 1,
      phaseStartedAt: new Date().toISOString(),
    })
    return { players, song: null }
  }

  await markSongAsUsed(room.id, song.id)
  const freshPreviewUrl = await getFreshPreviewUrl(song.deezer_id)

  await setGameState(roomCode, {
    phase: 'song_phase',
    currentPlayerId: firstPlayer.id,
    currentSongId: song.id,
    roundNumber: 1,
    phaseStartedAt: new Date().toISOString(),
  })

  return {
    players,
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