import { db } from '../db/database.js'
import { sql } from 'kysely'

export const getRandomSong = async (roomId: string) => {
  const song = await db
    .selectFrom('songs')
    .selectAll()
    .where('id', 'not in', (qb) =>
      qb
        .selectFrom('used_songs')
        .select('song_id')
        .where('room_id', '=', roomId)
    )
    .orderBy(sql`RANDOM()`)
    .limit(1)
    .executeTakeFirst()

  return song ?? null
}

export const markSongAsUsed = async (roomId: string, songId: string) => {
  await db.insertInto('used_songs').values({ room_id: roomId, song_id: songId }).execute()
}