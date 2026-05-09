import type { Generated, Selectable, Insertable } from 'kysely'

export interface SongsTable {
  id: Generated<string>
  title: string
  artist: string
  year: number
  decade: string
  deezer_id: string
  preview_url: string
}

export interface RoomsTable {
  id: Generated<string>
  code: string
  status: string
  host_id: string | null
  songs_per_player: number
  decade_filter: string
  created_at: Generated<Date>
}

export interface PlayersTable {
  id: Generated<string>
  room_id: string
  name: string
  avatar: string | null
  socket_id: string | null
  tokens: number
  is_host: boolean
  turn_order: number | null
  joined_at: Generated<Date>
}

export interface TimelineEntriesTable {
  id: Generated<string>
  player_id: string
  song_id: string
  position: number
  placed_at: Generated<Date>
}

export interface UsedSongsTable {
  id: Generated<string>
  room_id: string
  song_id: string
}

export interface DB {
  songs: SongsTable
  rooms: RoomsTable
  players: PlayersTable
  timeline_entries: TimelineEntriesTable
  used_songs: UsedSongsTable
}

export type Song = Selectable<SongsTable>
export type Room = Selectable<RoomsTable>
export type Player = Selectable<PlayersTable>
export type NewRoom = Insertable<RoomsTable>
export type NewPlayer = Insertable<PlayersTable>