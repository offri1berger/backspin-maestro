import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { FileMigrationProvider, Migrator } from 'kysely'
import { promises as fs } from 'fs'
import { db } from './database.js'

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.resolve(__dirname, 'migrations'),
  }),
})

const command = process.argv[2]

const migrate = async () => {
  if (command === 'down') {
    const { error, results } = await migrator.migrateDown()
    results?.forEach((r) => {
      if (r.status === 'Success') console.log(`rolled back: ${r.migrationName}`)
      if (r.status === 'Error') console.error(`error rolling back: ${r.migrationName}`)
    })
    if (error) { console.error(error); process.exit(1) }
  } else {
    const { error, results } = await migrator.migrateToLatest()
    results?.forEach((r) => {
      if (r.status === 'Success') console.log(`migrated: ${r.migrationName}`)
      if (r.status === 'Error') console.error(`error migrating: ${r.migrationName}`)
    })
    if (error) { console.error(error); process.exit(1) }
  }

  await db.destroy()
}

migrate()