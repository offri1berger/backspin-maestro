import type { Socket, Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents } from '@hitster/shared'
import { validatePlacement } from '../services/placementService.js'
import { nextTurnService, checkWinCondition } from '../services/gameService.js'
import { handleGuessService } from '../services/guessService.js'
import { getGameState } from '../lib/gameCache.js'
import { getPlayersByRoomId } from '../db/queries/players.js'
import { getRoomByCode, updateRoomStatus } from '../db/queries/rooms.js'
import { db } from '../db/database.js'

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>

export const registerGameHandlers = (io: IoServer, socket: IoSocket) => {
  socket.on('card:place', async (payload, cb) => {
    try {
      const rooms = [...socket.rooms].filter((r) => r !== socket.id)
      const roomCode = rooms[0]
      if (!roomCode) { cb('not_in_room'); return }

      const gameState = await getGameState(roomCode)
      if (!gameState) { cb('game_not_found'); return }

      const room = await getRoomByCode(roomCode)
      if (!room) { cb('room_not_found'); return }

      const players = await getPlayersByRoomId(room.id)
      const player = players.find((p) => p.socket_id === socket.id)
      if (!player) { cb('player_not_found'); return }

      const song = await db
        .selectFrom('songs')
        .selectAll()
        .where('id', '=', gameState.currentSongId!)
        .executeTakeFirstOrThrow()

      const result = await validatePlacement(roomCode, player.id, payload.position)
      if ('error' in result) { cb(result.error); return }

      io.to(roomCode).emit('placement:result', {
        playerId: player.id,
        correct: result.correct,
        song: {
          id: song.id,
          title: song.title,
          artist: song.artist,
          year: song.year,
          previewUrl: song.preview_url,
          deezerTrackId: song.deezer_id,
        },
        correctPosition: result.correctPosition,
      })

      cb()

      setTimeout(async () => {
        if (result.correct) {
          const freshRoom = await getRoomByCode(roomCode)
          if (!freshRoom) return

          const freshPlayers = await getPlayersByRoomId(freshRoom.id)
          const freshPlayer = freshPlayers.find((p) => p.socket_id === socket.id)
          if (!freshPlayer) return

          const won = await checkWinCondition(freshPlayer.id, freshRoom.id, freshRoom.songs_per_player)

          if (won) {
            await updateRoomStatus(freshRoom.id, 'finished')
            io.to(roomCode).emit('game:over', freshPlayer.id, freshPlayers.map((p) => ({
              id: p.id,
              name: p.name,
              tokens: p.tokens,
              isHost: p.is_host,
              turnOrder: p.turn_order ?? 0,
              timeline: [],
            })))
            return
          }
        }

        const next = await nextTurnService(roomCode)
        if ('error' in next) return

        io.to(roomCode).emit('phase:changed', 'song_phase', new Date().toISOString(), next.nextPlayerId)
        io.to(roomCode).emit('song:new', next.song)
      }, 2000)

    } catch (err) {
      console.error('card:place error', err)
      cb('server_error')
    }
  })

  socket.on('song:guess', async (payload) => {
    try {
      const rooms = [...socket.rooms].filter((r) => r !== socket.id)
      const roomCode = rooms[0]
      if (!roomCode) return

      const result = await handleGuessService(roomCode, socket.id, payload.artist, payload.title)

      if ('error' in result) {
        console.error('guess error:', result.error)
        return
      }

      if (result.correct) {
        const player = await db
          .selectFrom('players')
          .selectAll()
          .where('socket_id', '=', socket.id)
          .executeTakeFirstOrThrow()

        io.to(roomCode).emit('token:earned', player.id, result.tokens)
      }
    } catch (err) {
      console.error('song:guess error', err)
    }
  })

  socket.on('audio:play', () => {
    const rooms = [...socket.rooms].filter((r) => r !== socket.id)
    const roomCode = rooms[0]
    if (roomCode) socket.to(roomCode).emit('audio:play')
  })

  socket.on('audio:pause', () => {
    const rooms = [...socket.rooms].filter((r) => r !== socket.id)
    const roomCode = rooms[0]
    if (roomCode) socket.to(roomCode).emit('audio:pause')
  })
}