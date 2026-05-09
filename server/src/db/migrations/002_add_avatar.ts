import type { Kysely } from 'kysely'

export const up = async (db: Kysely<any>) => {
  await db.schema
    .alterTable('players')
    .addColumn('avatar', 'varchar(255)')
    .execute()
}

export const down = async (db: Kysely<any>) => {
  await db.schema
    .alterTable('players')
    .dropColumn('avatar')
    .execute()
}
