import { db } from '../db/database.js'
import { addUsedSong, getUsedSongIds } from '../lib/gameCache.js'
import { getSessionRoom } from '../lib/session.js'

export const getRandomSong = async (roomCode: string) => {
  const [usedIds, room] = await Promise.all([
    getUsedSongIds(roomCode),
    getSessionRoom(roomCode),
  ])
  const decadeFilter = room?.decadeFilter ?? 'all'

  let countQuery = db.selectFrom('songs').select((eb) => eb.fn.countAll<number>().as('count'))
  if (usedIds.length > 0) countQuery = countQuery.where('id', 'not in', usedIds)
  if (decadeFilter !== 'all') countQuery = countQuery.where('decade', '=', decadeFilter)

  const { count } = await countQuery.executeTakeFirstOrThrow()
  const total = Number(count)
  if (total === 0) return null

  let songQuery = db.selectFrom('songs').selectAll().limit(1).offset(Math.floor(Math.random() * total))
  if (usedIds.length > 0) songQuery = songQuery.where('id', 'not in', usedIds)
  if (decadeFilter !== 'all') songQuery = songQuery.where('decade', '=', decadeFilter)

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
    const data = (await res.json()) as { preview?: string | null }
    return data.preview ?? null
  } catch {
    return null
  }
}