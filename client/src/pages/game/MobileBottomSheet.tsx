import { useEffect, useRef, useState } from 'react'
import type { Player } from '@backspin-maestro/shared'
import AudioPlayer from '../../components/game/AudioPlayer'
import { useGameStore } from '../../store/gameStore'

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
  isMyTurn, canSteal, mobilePending, mobileConfirmed, guess, myPlayer,
  stealerName, countdown, onStealInitiate, onSkip, onGuessChange, onConfirm,
  onHeightChange,
}) => {
  const { isStealWindowOpen, currentSong, isWaitingForNextTurn } = useGameStore()
  const ref = useRef<HTMLDivElement>(null)
  const [guessOpen, setGuessOpen] = useState(false)

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

  const hasGuess = guess.artist.length > 0 || guess.title.length > 0
  const showInputs = guessOpen || hasGuess
  const isPending = mobilePending !== null && !mobileConfirmed
  const showSecondary = isMyTurn && !isWaitingForNextTurn && !mobileConfirmed && !isPending

  return (
    <div
      ref={ref}
      className="sheet-slide-up fixed bottom-0 left-0 right-0 bg-bg/95 backdrop-blur-md border-t border-line z-20 px-4 pt-3 flex flex-col gap-2"
      style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))' }}
    >
      {isStealWindowOpen && (
        <div className={`flex items-center justify-between px-4 py-2 rounded-full bg-surface border ${stealerName ? 'border-accent' : 'border-line'}`}>
          <span className={`font-mono text-[10px] tracking-[0.1em] uppercase ${stealerName ? 'text-accent' : 'text-muted'}`}>
            {stealerName ? `⚡ ${stealerName} is stealing…` : 'steal window open'}
          </span>
          <span className={`font-display text-[22px] leading-none ${countdown <= 3 ? 'text-bad' : 'text-accent'}`}>
            {countdown}
          </span>
        </div>
      )}

      {currentSong && !isPending && (
        <AudioPlayer key={currentSong.id} song={currentSong} isMyTurn={isMyTurn} compact />
      )}

      {canSteal && (
        <button
          onClick={onStealInitiate}
          className="w-full h-12 text-[15px] rounded-full bg-accent text-accent-ink border-0 cursor-pointer font-body font-bold flex items-center justify-center"
        >
          Steal! · 1 ★
        </button>
      )}

      {showSecondary && (
        <>
          {!showInputs ? (
            <button
              onClick={() => setGuessOpen(true)}
              className="w-full h-9 rounded-full bg-transparent border border-dashed border-line text-muted text-[11px] font-mono tracking-[0.12em] uppercase cursor-pointer flex items-center justify-center gap-2 hover:text-on-bg hover:border-line transition-colors"
            >
              <span>+ add guess</span>
              <span className="text-[9px] opacity-70">artist or title</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              {(['artist', 'title'] as const).map((field) => (
                <input
                  key={field}
                  placeholder={`${field.charAt(0).toUpperCase() + field.slice(1)} (optional bonus)`}
                  value={guess[field]}
                  onChange={(e) => onGuessChange(field, e.target.value)}
                  className="h-11 rounded-xl border border-line bg-transparent text-base text-on-bg px-4 font-body outline-none w-full focus:border-accent transition-colors"
                />
              ))}
            </div>
          )}

          {mobilePending === null && (myPlayer?.tokens ?? 0) >= 1 && (
            <button
              onClick={onSkip}
              className="w-full h-9 text-[11px] rounded-full bg-transparent border border-line font-mono tracking-[0.12em] uppercase text-muted cursor-pointer hover:text-on-bg transition-colors"
            >
              Skip · spend 1 ★
            </button>
          )}
        </>
      )}

      {isPending && (
        <button
          onClick={onConfirm}
          className="w-full h-14 text-[17px] rounded-full bg-accent text-accent-ink border-0 cursor-pointer font-body font-bold flex items-center justify-center gap-2 shadow-[0_8px_24px_color-mix(in_oklch,_var(--color-accent)_45%,_transparent)]"
        >
          Lock it in
          <svg width="16" height="16" viewBox="0 0 14 14">
            <path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default MobileBottomSheet
