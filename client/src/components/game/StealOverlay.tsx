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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }}
    >
      <div
        className="w-full max-w-[620px] bg-bg rounded-[32px] p-9 border border-line relative overflow-hidden"
        style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.45)' }}
      >
        {/* background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDanger
              ? 'radial-gradient(circle at top, rgba(255,80,80,0.12), transparent 55%)'
              : 'radial-gradient(circle at top, rgba(255,255,255,0.06), transparent 55%)',
          }}
        />

        {/* header */}
        <div className="flex items-start justify-between mb-6 relative z-[1]">
          <div>
            <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted mb-2">
              Steal attempt
            </div>
            <h2 className="font-display text-[38px] leading-none tracking-[-0.03em] m-0 text-on-bg">
              Steal the card
            </h2>
          </div>
          <button
            onClick={onClose}
            className="bg-transparent border border-line rounded-full h-9 px-3.5 cursor-pointer text-muted font-mono text-[10px] tracking-[0.14em] uppercase"
          >
            ESC
          </button>
        </div>

        {/* countdown ring */}
        <div className="flex justify-center mb-7 relative z-[1]">
          <div
            className="w-[120px] h-[120px] rounded-full flex items-center justify-center"
            style={{
              border: `6px solid ${isDanger ? 'var(--color-bad)' : 'var(--color-accent)'}`,
              background: 'color-mix(in oklch, var(--color-surface) 80%, transparent)',
              boxShadow: isDanger ? '0 0 40px rgba(255,80,80,0.35)' : '0 0 40px rgba(255,255,255,0.06)',
              transform: isDanger ? 'scale(1.04)' : 'scale(1)',
              transition: 'all 0.2s ease',
              animation: isDanger ? 'pulse 0.9s infinite' : 'none',
            }}
          >
            <div className="flex flex-col items-center leading-none">
              <span
                className="font-display text-[52px]"
                style={{ color: isDanger ? 'var(--color-bad)' : 'var(--color-accent)' }}
              >
                {countdown}
              </span>
              <span className="mt-1 font-mono text-[9px] tracking-[0.16em] uppercase text-muted">
                seconds
              </span>
            </div>
          </div>
        </div>

        {/* description */}
        <div className="text-center mb-7 relative z-[1]">
          <p className="text-muted text-[15px] leading-relaxed m-0">
            Place the song correctly in{' '}
            <strong className="text-on-bg">{activePlayer?.name}</strong>'s timeline.
          </p>
          <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-line" style={{ background: 'color-mix(in oklch, var(--color-on-bg) 5%, transparent)' }}>
            <span className="text-sm">★</span>
            <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted">
              Costs 1 token
            </span>
          </div>
        </div>

        {/* timeline */}
        <div className="relative z-[1]">
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
