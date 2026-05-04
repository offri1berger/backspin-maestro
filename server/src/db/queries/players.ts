import { db } from '../database.js'
import type { NewPlayer } from '../types.js'

export const createPlayer = async (player: NewPlayer) =>
  db.insertInto('players').values(player).returningAll().executeTakeFirstOrThrow()

export const getPlayersByRoomId = async (roomId: string) =>
  db.selectFrom('players').selectAll().where('players.room_id', '=', roomId).execute()

export const updatePlayerSocketId = async (id: string, socketId: string) =>
  db.updateTable('players').set({ socket_id: socketId }).where('players.id', '=', id).executeTakeFirstOrThrow()

export const deletePlayer = async (id: string) =>
  db.deleteFrom('players').where('players.id', '=', id).executeTakeFirstOrThrow()