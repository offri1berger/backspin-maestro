import { useGameStore } from '../../store/gameStore'
import Timeline from './Timeline'

interface Props {
  countdown: number
  onStealAttempt: (position: number) => void
  onClose: () => void
}

export const StealOverlay = ({ countdown, onStealAttempt, onClose }: Props) => {
  const { currentSong, currentPlayerId, players } = useGameStore()
  const activePlayer = players.find((p) => p.id === currentPlayerId)
  const activeTimeline = activePlayer?.timeline ?? []

  if (!currentSong) return null

  const isDanger = countdown <= 3

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 620,
        background: 'var(--bg)', borderRadius: 32, padding: 36,
        border: '1px solid var(--line)', boxShadow: '0 40px 100px rgba(0,0,0,0.45)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* background glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: isDanger
            ? 'radial-gradient(circle at top, rgba(255,80,80,0.12), transparent 55%)'
            : 'radial-gradient(circle at top, rgba(255,255,255,0.06), transparent 55%)',
        }} />

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
              Steal attempt
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 38, lineHeight: 1, letterSpacing: '-0.03em', margin: 0, color: 'var(--on-bg)' }}>
              Steal the card
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: '1px solid var(--line)',
              borderRadius: 999, height: 36, padding: '0 14px',
              cursor: 'pointer', color: 'var(--muted)',
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
            }}
          >
            ESC
          </button>
        </div>

        {/* countdown ring */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28, position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            border: `6px solid ${isDanger ? 'var(--bad)' : 'var(--accent)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'color-mix(in oklch, var(--surface) 80%, transparent)',
            boxShadow: isDanger ? '0 0 40px rgba(255,80,80,0.35)' : '0 0 40px rgba(255,255,255,0.06)',
            transform: isDanger ? 'scale(1.04)' : 'scale(1)',
            transition: 'all 0.2s ease',
            animation: isDanger ? 'pulse 0.9s infinite' : 'none',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 52, color: isDanger ? 'var(--bad)' : 'var(--accent)' }}>
                {countdown}
              </span>
              <span style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                seconds
              </span>
            </div>
          </div>
        </div>

        {/* description */}
        <div style={{ textAlign: 'center', marginBottom: 28, position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.5, margin: 0 }}>
            Place the song correctly in{' '}
            <strong style={{ color: 'var(--on-bg)' }}>{activePlayer?.name}</strong>'s timeline.
          </p>
          <div style={{
            marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 999,
            background: 'color-mix(in oklch, var(--on-bg) 5%, transparent)', border: '1px solid var(--line)',
          }}>
            <span style={{ fontSize: 14 }}>★</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Costs 1 token
            </span>
          </div>
        </div>

        {/* timeline */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Timeline
            timeline={activeTimeline}
            currentSong={currentSong}
            onPlace={onStealAttempt}
            isMyTurn
            isWaiting={false}
            broadcastDrag={false}
            autoConfirm
          />
        </div>

        <style>{`@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }`}</style>
      </div>
    </div>
  )
}
