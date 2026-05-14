import { useEffect, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { useIsMobile } from '../../hooks/useMediaQuery'
import Timeline from './Timeline'
import Sticker from '../boombox/Sticker'
import LedDisplay from '../boombox/LedDisplay'

interface Props {
  countdown: number
  onStealAttempt: (position: number) => void
  onClose: () => void
}

export const StealOverlay = ({ countdown, onStealAttempt, onClose }: Props) => {
  const { currentSong, currentPlayerId, players, stealOriginalPosition } = useGameStore()
  const activePlayer = players.find((p) => p.id === currentPlayerId)
  const activeTimeline = activePlayer?.timeline ?? []

  const [pendingPosition, setPendingPosition] = useState<number | null>(stealOriginalPosition)
  const trapRef = useFocusTrap<HTMLDivElement>(true)
  const isMobile = useIsMobile()

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!currentSong) return null

  const isDanger = countdown <= 3

  return (
    <div
      ref={trapRef}
      role="dialog"
      aria-modal="true"
      aria-label="Steal attempt"
      className="fixed inset-0 z-50 flex items-start lg:items-center justify-center p-3 lg:p-6 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)' }}
    >
      <div
        ref={null}
        className="w-full max-w-[620px] brushed-darker panel-hardware p-5 lg:p-7 relative my-auto"
      >
        <div className="flex items-start justify-between mb-4 lg:mb-6">
          <div>
            <Sticker color="red" rotate={-4} size="sm">★ STEAL ALERT</Sticker>
            <h2
              className="font-display mt-2"
              style={{ fontSize: 28, lineHeight: 1, color: 'var(--color-cream)', textShadow: '3px 3px 0 var(--color-hot), 6px 6px 0 var(--color-accent-ink)' }}
            >
              SNATCH THE CARD!
            </h2>
          </div>
          <button
            onClick={onClose}
            className="plastic-btn plastic-btn-dark h-9 px-3.5 text-[10px]"
          >
            ESC
          </button>
        </div>

        <div className="flex justify-center mb-5">
          <LedDisplay
            color={isDanger ? 'red' : 'yellow'}
            style={{
              fontSize: 44, padding: '12px 22px', minWidth: 100, textAlign: 'center',
              animation: isDanger ? 'steal-pulse 0.9s infinite' : 'none',
            }}
          >
            {countdown}s
          </LedDisplay>
        </div>

        <p className="text-center mb-5 text-[14px]" style={{ color: 'var(--color-muted)' }}>
          Place the song correctly in{' '}
          <strong style={{ color: 'var(--color-cream)' }}>{activePlayer?.name}</strong>'s shelf.
          <span
            className="font-display mx-2 px-2 py-0.5 inline-block"
            style={{ background: 'var(--color-accent)', color: 'var(--color-accent-ink)', fontSize: 11, borderRadius: 4 }}
          >
            COST 1 ★
          </span>
        </p>

        <Timeline
          timeline={activeTimeline}
          currentSong={currentSong}
          onPlace={onStealAttempt}
          isMyTurn
          isWaiting={false}
          broadcastDrag={false}
          pendingPosition={pendingPosition}
          onPendingChange={setPendingPosition}
          vertical={isMobile}
        />

        <style>{`@keyframes steal-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }`}</style>
      </div>
    </div>
  )
}
