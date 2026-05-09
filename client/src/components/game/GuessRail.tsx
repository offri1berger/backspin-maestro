import { useGameStore } from '../../store/gameStore'
import { SectionMark } from './common'

interface Props {
  guess: { artist: string; title: string }
  onGuessChange: (field: 'artist' | 'title', value: string) => void
  isMyTurn: boolean
  isWaiting: boolean
}

export const GuessRail = ({ guess, onGuessChange, isMyTurn, isWaiting }: Props) => {
  const { players, currentPlayerId, playerId, stealResult, placementResult } = useGameStore()
  const myPlayer = players.find((p) => p.id === playerId)
  const activePlayer = players.find((p) => p.id === currentPlayerId)
  const disabled = !isMyTurn || isWaiting

  return (
    <aside style={{
      padding: '20px',
      borderLeft: '1px solid var(--line)',
      overflowY: 'auto',
      background: 'var(--bg)',
    }}>
      <SectionMark>Bonus guess</SectionMark>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, lineHeight: 1.4 }}>
        Optional. Fill in before placing — submitted with your card.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
        {(['artist', 'title'] as const).map((field) => (
          <input
            key={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={guess[field]}
            onChange={(e) => onGuessChange(field, e.target.value)}
            disabled={disabled}
            style={{
              height: 44, borderRadius: 12,
              border: '1px solid var(--line)',
              background: 'transparent', color: 'var(--on-bg)',
              padding: '0 14px', fontSize: 14,
              fontFamily: 'var(--font-body)', outline: 'none',
              opacity: disabled ? 0.4 : 1,
            }}
          />
        ))}
      </div>

      <div style={{ marginTop: 28 }}>
        <SectionMark>Action log</SectionMark>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stealResult && (() => {
            const stealerName = players.find((p) => p.id === stealResult.stealerId)?.name ?? 'Someone'
            return (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                  background: stealResult.correct ? 'var(--good)' : 'var(--bad)', display: 'inline-block',
                }} />
                <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--on-bg)' }}>
                  <b>{stealerName}</b> {stealResult.correct ? 'stole successfully' : 'failed to steal'}
                </div>
              </div>
            )
          })()}
          {placementResult && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                background: placementResult.correct ? 'var(--good)' : 'var(--bad)', display: 'inline-block',
              }} />
              <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--on-bg)' }}>
                <b>{activePlayer?.name}</b> {placementResult.correct ? 'placed correctly' : 'missed placement'}
                {placementResult.song && !placementResult.correct && (
                  <span style={{ color: 'var(--muted)' }}>
                    {' '}· {placementResult.song.title} ({placementResult.song.year})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 28, padding: '14px 16px', border: '1px solid var(--line)', borderRadius: 16 }}>
        <SectionMark>Deck</SectionMark>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
          {([
            ['Players', `${players.length}`],
            ['Cards needed', '10'],
            ['Your cards', `${myPlayer?.timeline.length ?? 0}`],
            ['Your ★', `${myPlayer?.tokens ?? 0}`],
          ] as const).map(([k, v]) => (
            <div key={k}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 9,
                letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)',
              }}>{k}</div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 22,
                color: 'var(--accent)', marginTop: 2, lineHeight: 1,
              }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
