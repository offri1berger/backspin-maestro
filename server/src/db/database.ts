import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { DB } from './types.js'

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({
      host: 'localhost',
      port: 5432,
      database: 'hitster',
      user: 'hitster',
      password: 'hitster',
    }),
  }),
})