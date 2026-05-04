import { db } from '../database.js'
import type { NewRoom } from '../types.js'

export const createRoom = async (room: NewRoom) =>
  db.insertInto('rooms').values(room).returningAll().executeTakeFirstOrThrow()

export const getRoomById = async (id: string) =>
  db.selectFrom('rooms').selectAll().where('rooms.id', '=', id).executeTakeFirst()

export const updateRoomStatus = async (id: string, status: string) =>
  db.updateTable('rooms').set({ status }).where('rooms.id', '=', id).executeTakeFirstOrThrow()

export const updateRoomHost = async (id: string, hostId: string) =>
  db.updateTable('rooms').set({ host_id: hostId }).where('rooms.id', '=', id).executeTakeFirstOrThrow()