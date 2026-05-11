import dotenv from 'dotenv'
dotenv.config()

import { db } from './database.js'
console.log('starting seed...')

const songs = [
  { q: 'Royals Lorde', year: 2012 },
]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const getDecade = (year: number): string => `${Math.floor(year / 10) * 10 % 100}s`

const seed = async () => {
  console.log('seeding songs...')
  let inserted = 0
  let skipped = 0

  for (const song of songs) {
    try {
      const res = await fetch(
        `https://api.deezer.com/search?q=${encodeURIComponent(song.q)}&limit=1`
      )
      interface DeezerTrack {
        id: number
        title_short: string
        artist: { name: string }
        preview: string
      }
      const data = (await res.json()) as { data?: DeezerTrack[] }

      if (!data.data || data.data.length === 0 || !data.data[0].preview) {
        console.log(`✗ no preview: ${song.q}`)
        skipped++
        continue
      }

      const track = data.data[0]

      const existing = await db
        .selectFrom('songs')
        .select('id')
        .where('deezer_id', '=', String(track.id))
        .executeTakeFirst()

      if (existing) {
        skipped++
        continue
      }

      await db.insertInto('songs').values({
        title: track.title_short,
        artist: track.artist.name,
        year: song.year,
        decade: getDecade(song.year),
        deezer_id: String(track.id),
        preview_url: track.preview,
      }).execute()

      inserted++
      console.log(`✓ ${track.artist.name} — ${track.title_short} (${song.year})`)

      await sleep(200)
    } catch (err) {
      console.error(`✗ failed: ${song.q}`, err)
    }
  }

  console.log(`\ndone! inserted ${inserted}, skipped ${skipped}`)
  await db.destroy()
}

seed()