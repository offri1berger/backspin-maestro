import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export const up = async (db: Kysely<any>) => {
  await db.schema.dropIndex('idx_used_songs_room_id').execute()
  await db.schema.dropTable('used_songs').execute()
}

export const down = async (db: Kysely<any>) => {
  await db.schema
    .createTable('used_songs')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('room_id', 'uuid', (col) => col.notNull().references('rooms.id').onDelete('cascade'))
    .addColumn('song_id', 'uuid', (col) => col.notNull().references('songs.id'))
    .execute()

  await db.schema.createIndex('idx_used_songs_room_id').on('used_songs').column('room_id').execute()
  await sql`ALTER TABLE used_songs ADD CONSTRAINT unique_room_song UNIQUE (room_id, song_id)`.execute(db)
}
