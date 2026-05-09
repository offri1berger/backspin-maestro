import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export const up = async (db: Kysely<any>) => {
  await db.schema.createIndex('idx_players_socket_id').on('players').column('socket_id').execute()
  await db.schema.createIndex('idx_songs_deezer_id').on('songs').column('deezer_id').execute()
  await sql`
    ALTER TABLE rooms
    ADD CONSTRAINT fk_rooms_host_id
    FOREIGN KEY (host_id) REFERENCES players(id) ON DELETE SET NULL
  `.execute(db)
}

export const down = async (db: Kysely<any>) => {
  await sql`ALTER TABLE rooms DROP CONSTRAINT fk_rooms_host_id`.execute(db)
  await db.schema.dropIndex('idx_songs_deezer_id').execute()
  await db.schema.dropIndex('idx_players_socket_id').execute()
}
