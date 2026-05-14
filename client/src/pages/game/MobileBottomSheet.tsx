import { useEffect, useRef } from 'react'
import type { Player } from '@backspin-maestro/shared'
import AudioPlayer from '../../components/game/AudioPlayer'
import { useGameStore } from '../../store/gameStore'
import LedDisplay from '../../components/boombox/LedDisplay'
import PlasticButton from '../../components/boombox/PlasticButton'

interface Props {
  isMyTurn: boolean
  canSteal: boolean
  mobilePending: number | null
  mobileConfirmed: boolean
  guess: { artist: string; title: string }
  myPlayer: Player | undefined
  stealerName: string | null
  countdown: number
  onStealInitiate: () => void
  onSkip: () => void
  onGuessChange: (field: 'artist' | 'title', value: string) => void
  onConfirm: () => void
  onHeightChange?: (height: number) => void
}

const MobileBottomSheet: React.FC<Props> = ({
  isMyTurn, canSteal, mobilePending, mobileConfirmed, myPlayer,
  stealerName, countdown, onStealInitiate, onSkip, onConfirm,
  onHeightChange,
}) => {
  const { isStealWindowOpen, currentSong, isWaitingForNextTurn } = useGameStore()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!onHeightChange) return
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height
      if (h != null) onHeightChange(h)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [onHeightChange])

  const isPending = mobilePending !== null && !mobileConfirmed
  const showSecondary = isMyTurn && !isWaitingForNextTurn && !mobileConfirmed && !isPending

  return (
    <div
      ref={ref}
      className="sheet-slide-up fixed bottom-0 left-0 right-0 z-20 px-3 pt-3 flex flex-col gap-2.5"
      style={{
        background: 'rgba(26,26,28,.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '2px solid #000',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
      }}
    >
      {isStealWindowOpen && (
        <div
          className="flex items-center justify-between px-3.5 py-2 rounded-[8px] gap-2"
          style={{
            background: '#0a0a0a',
            border: `2px solid ${stealerName ? 'var(--color-hot)' : 'var(--color-muted-2)'}`,
            boxShadow: stealerName ? '0 0 12px color-mix(in srgb, var(--color-hot) 50%, transparent)' : 'none',
          }}
        >
          <span
            className="font-display"
            style={{ fontSize: 11, color: stealerName ? 'var(--color-hot)' : 'var(--color-muted)', letterSpacing: '.05em' }}
          >
            {stealerName ? `⚡ ${stealerName.toUpperCase()} IS STEALING…` : 'STEAL WINDOW OPEN'}
          </span>
          <LedDisplay
            color={countdown <= 3 ? 'red' : 'yellow'}
            style={{ fontSize: 18, padding: '4px 10px' }}
          >
            {countdown}s
          </LedDisplay>
        </div>
      )}

      {currentSong && (
        <AudioPlayer key={currentSong.id} song={currentSong} isMyTurn={isMyTurn} compact />
      )}

      {canSteal && (
        <PlasticButton
          onClick={onStealInitiate}
          color="pink"
          className="w-full h-12 text-[14px] flex items-center justify-center"
        >
          ★ STEAL! · 1 ★
        </PlasticButton>
      )}

      {showSecondary && mobilePending === null && (myPlayer?.tokens ?? 0) >= 1 && (
        <button
          onClick={onSkip}
          className="w-full h-9 rounded-[8px] cursor-pointer font-display"
          style={{
            background: '#1a1a1c',
            border: '2px solid #000',
            color: 'var(--color-cream)',
            fontSize: 11, letterSpacing: '.05em',
            boxShadow: '0 2px 0 #000',
          }}
        >
          SKIP · SPEND 1 ★
        </button>
      )}

      {isPending && (
        <PlasticButton
          onClick={onConfirm}
          color="green"
          className="w-full h-14 text-[17px] flex items-center justify-center gap-2"
        >
          ★ LOCK IT IN ★
        </PlasticButton>
      )}
    </div>
  )
}

export default MobileBottomSheet
