import { db } from '../db/database.js'
import { addUsedSong, getUsedSongIds } from '../lib/gameCache.js'
import { getSessionRoom } from '../lib/session.js'
import { deezerFetches } from '../lib/metrics.js'
import { logger } from '../lib/logger.js'
import type { DecadeFilter } from '@backspin-maestro/shared'

export const getRandomSong = async (roomCode: string, overrideDecadeFilter?: DecadeFilter) => {
  const usedIds = await getUsedSongIds(roomCode)
  const decadeFilter = overrideDecadeFilter ?? (await getSessionRoom(roomCode))?.decadeFilter ?? 'all'
  const decadesIn: string[] | null = decadeFilter === 'all'
    ? null
    : Array.isArray(decadeFilter) ? decadeFilter : [decadeFilter]

  let countQuery = db.selectFrom('songs').select((eb) => eb.fn.countAll<number>().as('count'))
  if (usedIds.length > 0) countQuery = countQuery.where('id', 'not in', usedIds)
  if (decadesIn) countQuery = countQuery.where('decade', 'in', decadesIn)

  const { count } = await countQuery.executeTakeFirstOrThrow()
  const total = Number(count)
  if (total === 0) return null

  let songQuery = db.selectFrom('songs').selectAll().limit(1).offset(Math.floor(Math.random() * total))
  if (usedIds.length > 0) songQuery = songQuery.where('id', 'not in', usedIds)
  if (decadesIn) songQuery = songQuery.where('decade', 'in', decadesIn)

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
    if (!res.ok) {
      deezerFetches.inc({ result: 'fail' })
      logger.warn({ deezerId, status: res.status }, 'deezer preview fetch non-2xx')
      return null
    }
    const data = (await res.json()) as { preview?: string | null }
    deezerFetches.inc({ result: 'ok' })
    return data.preview ?? null
  } catch (err) {
    deezerFetches.inc({ result: 'fail' })
    logger.warn({ err, deezerId }, 'deezer preview fetch threw')
    return null
  }
}