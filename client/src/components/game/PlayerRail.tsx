import { useGameStore } from '../../store/gameStore'
import { SectionMark, PLAYER_COLORS } from './common'

export const PlayerRail = () => {
  const { players, currentPlayerId, playerId } = useGameStore()

  return (
    <aside style={{
      padding: '20px',
      borderRight: '1px solid var(--line)',
      overflowY: 'auto',
      background: 'var(--bg)',
    }}>
      <SectionMark>Crowd</SectionMark>

      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {players.map((p, i) => {
          const active = p.id === currentPlayerId
          const isMe = p.id === playerId
          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 14,
              background: active ? 'var(--accent)' : 'transparent',
              color: active ? 'var(--accent-ink)' : 'var(--on-bg)',
              border: active ? 'none' : '1px solid var(--line)',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: PLAYER_COLORS[i % PLAYER_COLORS.length],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: 18,
                color: '#1a1612', flexShrink: 0,
              }}>
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {p.name}{isMe ? ' (you)' : ''}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  letterSpacing: '0.1em', opacity: active ? 0.8 : 0.6, marginTop: 2,
                }}>
                  {p.timeline.length}/10 cards · {p.tokens}★
                </div>
              </div>
              {active && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700,
                }}>
                  now
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 28 }}>
        <SectionMark>Shortcuts</SectionMark>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {([['SPACE', 'Play / pause'], ['← →', 'Move card'], ['↵', 'Lock placement'], ['G', 'Guess input']] as const).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <kbd style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                padding: '3px 7px', borderRadius: 6,
                border: '1px solid var(--line)',
                background: 'color-mix(in oklch, var(--on-bg) 4%, transparent)',
                minWidth: 34, textAlign: 'center', color: 'var(--on-bg)',
              }}>{k}</kbd>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
