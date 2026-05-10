import type { Generated, Selectable } from 'kysely'

export interface SongsTable {
  id: Generated<string>
  title: string
  artist: string
  year: number
  decade: string
  deezer_id: string
  preview_url: string
}

export interface DB {
  songs: SongsTable
}

export type Song = Selectable<SongsTable>
