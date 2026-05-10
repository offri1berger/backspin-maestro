import { db } from '../db/database.js'
import { sql } from 'kysely'
import { addUsedSong, getUsedSongIds } from '../lib/gameCache.js'

export const getRandomSong = async (roomCode: string) => {
  const usedIds = await getUsedSongIds(roomCode)

  let query = db.selectFrom('songs').selectAll().orderBy(sql`RANDOM()`).limit(1)
  if (usedIds.length > 0) {
    query = query.where('id', 'not in', usedIds)
  }

  return (await query.executeTakeFirst()) ?? null
}

export const markSongAsUsed = async (roomCode: string, songId: string) => {
  await addUsedSong(roomCode, songId)
}

export const getFreshPreviewUrl = async (deezerId: string): Promise<string | null> => {
  try {
    const res = await fetch(`https://api.deezer.com/track/${deezerId}`)
    if (!res.ok) return null
    const data = await res.json() as any
    return data.preview ?? null
  } catch {
    return null
  }
}