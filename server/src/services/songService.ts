import { db } from '../db/database.js'
import { addUsedSong, getUsedSongIds } from '../lib/gameCache.js'

export const getRandomSong = async (roomCode: string) => {
  const usedIds = await getUsedSongIds(roomCode)

  let countQuery = db.selectFrom('songs').select((eb) => eb.fn.countAll<number>().as('count'))
  if (usedIds.length > 0) countQuery = countQuery.where('id', 'not in', usedIds)

  const { count } = await countQuery.executeTakeFirstOrThrow()
  const total = Number(count)
  if (total === 0) return null

  let songQuery = db.selectFrom('songs').selectAll().limit(1).offset(Math.floor(Math.random() * total))
  if (usedIds.length > 0) songQuery = songQuery.where('id', 'not in', usedIds)

  return (await songQuery.executeTakeFirst()) ?? null
}

export const markSongAsUsed = async (roomCode: string, songId: string) => {
  await addUsedSong(roomCode, songId)
}

export const getFreshPreviewUrl = async (deezerId: string): Promise<string | null> => {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4_000)
    const res = await fetch(`https://api.deezer.com/track/${deezerId}`, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return null
    const data = await res.json() as any
    return data.preview ?? null
  } catch {
    return null
  }
}