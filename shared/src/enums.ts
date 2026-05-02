export type GamePhase =
  | 'song_phase'
  | 'placement'
  | 'steal_window'
  | 'reveal'
  | 'game_over'

export type RoomStatus = 'lobby' | 'playing' | 'finished'

export type Decade = 'all' | '60s' | '70s' | '80s' | '90s' | '00s' | '10s'