export type GamePhase =
  | 'song_phase'
  | 'placement'
  | 'steal_window'
  | 'reveal'
  | 'game_over'

export type RoomStatus = 'lobby' | 'playing' | 'finished'

export type SpecificDecade = '60s' | '70s' | '80s' | '90s' | '00s' | '10s'
export type Decade = 'all' | SpecificDecade

/** Canonical chronological order — used to validate contiguity of multi-decade filters. */
export const SPECIFIC_DECADES_ORDER: SpecificDecade[] = ['60s', '70s', '80s', '90s', '00s', '10s']

/** A non-empty, contiguous selection of decades. `'all'` is the wildcard. */
export type DecadeFilter = 'all' | SpecificDecade[]