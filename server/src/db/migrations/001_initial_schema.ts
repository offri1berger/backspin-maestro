import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export const up = async (db: Kysely<any>) => {
  await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`.execute(db)

  await db.schema
    .createTable('songs')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('artist', 'varchar(255)', (col) => col.notNull())
    .addColumn('year', 'int2', (col) => col.notNull())
    .addColumn('decade', 'varchar(10)', (col) => col.notNull())
    .addColumn('deezer_id', 'varchar(50)', (col) => col.notNull())
    .addColumn('preview_url', 'varchar(512)', (col) => col.notNull())
    .execute()

  await db.schema
    .createTable('rooms')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('code', 'varchar(10)', (col) => col.notNull().unique())
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('lobby'))
    .addColumn('host_id', 'uuid')
    .addColumn('songs_per_player', 'int2', (col) => col.notNull().defaultTo(10))
    .addColumn('decade_filter', 'varchar(10)', (col) => col.notNull().defaultTo('all'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute()

  await db.schema
    .createTable('players')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('room_id', 'uuid', (col) => col.notNull().references('rooms.id').onDelete('cascade'))
    .addColumn('name', 'varchar(50)', (col) => col.notNull())
    .addColumn('socket_id', 'varchar(100)')
    .addColumn('tokens', 'int2', (col) => col.notNull().defaultTo(0))
    .addColumn('is_host', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('turn_order', 'int2')
    .addColumn('joined_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute()

  await db.schema
    .createTable('timeline_entries')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('player_id', 'uuid', (col) => col.notNull().references('players.id').onDelete('cascade'))
    .addColumn('song_id', 'uuid', (col) => col.notNull().references('songs.id'))
    .addColumn('position', 'int2', (col) => col.notNull())
    .addColumn('placed_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute()

  await db.schema
    .createTable('used_songs')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('room_id', 'uuid', (col) => col.notNull().references('rooms.id').onDelete('cascade'))
    .addColumn('song_id', 'uuid', (col) => col.notNull().references('songs.id'))
    .execute()

  await db.schema.createIndex('idx_players_room_id').on('players').column('room_id').execute()
  await db.schema.createIndex('idx_timeline_player_id').on('timeline_entries').column('player_id').execute()
  await db.schema.createIndex('idx_used_songs_room_id').on('used_songs').column('room_id').execute()
  await db.schema.createIndex('idx_songs_decade').on('songs').column('decade').execute()

  await sql`ALTER TABLE timeline_entries ADD CONSTRAINT unique_player_position UNIQUE (player_id, position)`.execute(db)
  await sql`ALTER TABLE used_songs ADD CONSTRAINT unique_room_song UNIQUE (room_id, song_id)`.execute(db)
}

export const down = async (db: Kysely<any>) => {
  await db.schema.dropIndex('idx_songs_decade').execute()
  await db.schema.dropIndex('idx_used_songs_room_id').execute()
  await db.schema.dropIndex('idx_timeline_player_id').execute()
  await db.schema.dropIndex('idx_players_room_id').execute()

  await db.schema.dropTable('used_songs').execute()
  await db.schema.dropTable('timeline_entries').execute()
  await db.schema.dropTable('players').execute()
  await db.schema.dropTable('rooms').execute()
  await db.schema.dropTable('songs').execute()
}