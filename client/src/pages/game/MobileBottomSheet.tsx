import type { Player } from '@hitster/shared'
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
}

const MobileBottomSheet: React.FC<Props> = ({
  isMyTurn, canSteal, mobilePending, mobileConfirmed, guess, myPlayer,
  stealerName, countdown, onStealInitiate, onSkip, onGuessChange, onConfirm,
}) => {  
  const { isStealWindowOpen, currentSong, isWaitingForNextTurn } = useGameStore()

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-bg border-t border-line z-20 px-4 pt-3 flex flex-col gap-2"
      style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
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

      {currentSong && (
        <AudioPlayer song={currentSong} isMyTurn={isMyTurn} compact />
      )}

      {canSteal && (
        <button
          onClick={onStealInitiate}
          className="w-full h-12 text-[15px] rounded-full bg-accent text-accent-ink border-0 cursor-pointer font-body font-bold flex items-center justify-center"
        >
          Steal! · 1 ★
        </button>
      )}

      {isMyTurn && !isWaitingForNextTurn && !mobileConfirmed && (
        <div className="flex flex-col gap-2">
          {(['artist', 'title'] as const).map((field) => (
            <input
              key={field}
              placeholder={`${field.charAt(0).toUpperCase() + field.slice(1)} (optional bonus guess)`}
              value={guess[field]}
              onChange={(e) => onGuessChange(field, e.target.value)}
              className="h-12 rounded-xl border border-line bg-transparent text-base text-on-bg px-4 font-body outline-none w-full"
            />
          ))}
        </div>
      )}

      {isMyTurn && !isWaitingForNextTurn && !mobileConfirmed && mobilePending === null && (myPlayer?.tokens ?? 0) >= 1 && (
        <button
          onClick={onSkip}
          className="w-full h-10 text-[11px] rounded-full bg-transparent border border-line font-mono tracking-[0.12em] uppercase text-muted cursor-pointer"
        >
          Skip · spend 1 ★
        </button>
      )}

      {isMyTurn && !isWaitingForNextTurn && mobilePending !== null && !mobileConfirmed && (
        <button
          onClick={onConfirm}
          className="w-full h-14 text-base rounded-full bg-accent text-accent-ink border-0 cursor-pointer font-body font-semibold flex items-center justify-center gap-2"
        >
          Lock in placement
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default MobileBottomSheet
