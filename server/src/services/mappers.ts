import { getTimeline } from '../lib/session.js'
import type { SessionPlayer } from '../lib/session.js'
import type { Song as DbSong } from '../db/types.js'
import type { Song, Player, TimelineEntry } from '@backspin-maestro/shared'

/**
 *  Map a DbSong to a Song, optionally replacing the preview URL with a fresh one from Deezer.
 * @param dbSong  The song as stored in the database 
 * @param freshPreviewUrl An optional fresh preview URL from Deezer; if not provided, the URL from the database will be used
 * @returns 
 */
export const toSong = (dbSong: DbSong, freshPreviewUrl?: string | null): Song => ({
  id: dbSong.id,
  title: dbSong.title,
  artist: dbSong.artist,
  year: dbSong.year,
  previewUrl: freshPreviewUrl ?? dbSong.preview_url,
  deezerTrackId: dbSong.deezer_id,
})

  /**
 *  Map a SessionPlayer to a Player, including fetching the player's timeline entries.
 * @param p The SessionPlayer to map
 * @returns A Promise that resolves to the mapped Player with timeline entries
 */
export const toPlayer = (
  p: SessionPlayer,
  timeline: TimelineEntry[] = [],
): Player => ({
  id: p.id,
  name: p.name,
  avatar: p.avatar || undefined,
  tokens: p.tokens,
  isHost: p.isHost,
  turnOrder: p.turnOrder,
  timeline,
})

/**
 *  Map a SessionPlayer to a Player, fetching the player's timeline entries from the database.
 * @param p The SessionPlayer to map
 * @returns A Promise that resolves to the mapped Player with timeline entries
 */
export const toPlayerWithTimeline = async (p: SessionPlayer): Promise<Player> =>
  toPlayer(p, await getTimeline(p.id))
