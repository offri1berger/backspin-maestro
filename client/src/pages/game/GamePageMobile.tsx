import { useState } from 'react'
import type { GamePageProps } from './useGamePage'
import { GameStage } from '../../components/game/GameStage'
import { Logo } from '../../components/ui/Logo'
import MobilePlayerBar from './MobilePlayerBar'
import MobileBottomSheet from './MobileBottomSheet'
import LedDisplay from '../../components/boombox/LedDisplay'
import { useGameStore } from '../../store/gameStore'

const GamePageMobile = (p: GamePageProps) => {
  const [mobilePending, _setMobilePending] = useState<number | null>(null)
  const [mobileConfirmed, setMobileConfirmed] = useState(false)
  const [sheetHeight, setSheetHeight] = useState(320)
  const isWaitingForNextTurn = useGameStore((s) => s.isWaitingForNextTurn)
  const setMobilePending = (val: number | null) => {
    _setMobilePending(val)
    if (val === null) setMobileConfirmed(false)
  }

  const showGuessBar = p.isMyTurn && !isWaitingForNextTurn && !mobileConfirmed

  return (
    <div className="flex flex-col lg:hidden min-h-dvh boombox-bg">
      <div
        className="px-4 py-2.5 flex items-center justify-between shrink-0"
        style={{ background: 'linear-gradient(180deg, #1a1a1c, #0a0a0a)', borderBottom: '2px solid #000' }}
      >
        <Logo variant="compact" />
        <div className="flex items-center gap-2">
          <LedDisplay color="green" style={{ fontSize: 12, padding: '3px 8px' }}>
            {p.roomCode}
          </LedDisplay>
          <button
            onClick={p.handleLeave}
            aria-label="Leave room"
            className="w-9 h-9 flex items-center justify-center bg-transparent border-0 cursor-pointer"
            style={{ color: 'var(--color-cream)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M10 5l3 3-3 3M13 8H6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <MobilePlayerBar songsToWin={p.songsToWin} />

      {showGuessBar && (
        <div
          className="px-3 py-2 flex gap-2 shrink-0"
          style={{ background: '#111113', borderBottom: '2px solid #000' }}
        >
          {(['artist', 'title'] as const).map((field) => (
            <input
              key={field}
              placeholder={field === 'artist' ? 'Artist guess…' : 'Title guess…'}
              value={p.guess[field]}
              onChange={(e) => p.onGuessChange(field, e.target.value)}
              style={{
                flex: 1, minWidth: 0,
                height: 38,
                background: 'var(--color-cream)',
                color: 'var(--color-accent-ink)',
                border: '2px solid #000',
                borderRadius: 6,
                padding: '0 10px',
                fontFamily: 'var(--font-code)', fontSize: 13,
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,.2)',
              }}
            />
          ))}
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto px-4 pt-4"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${sheetHeight + 16}px)` }}
      >
        <GameStage
          onPlace={p.handlePlace}
          onSkip={p.handleSkip}
          showAudioPlayer={false}
          showSkipButton={false}
          vertical={true}
          pendingPosition={mobilePending}
          onPendingChange={setMobilePending}
          showPlaceButton={false}
        />
      </div>

      <MobileBottomSheet
        isMyTurn={p.isMyTurn}
        canSteal={p.canSteal}
        mobilePending={mobilePending}
        mobileConfirmed={mobileConfirmed}
        guess={p.guess}
        myPlayer={p.myPlayer}
        stealerName={p.stealerName}
        countdown={p.countdown}
        onStealInitiate={p.handleStealInitiate}
        onSkip={p.handleSkip}
        onGuessChange={p.onGuessChange}
        onConfirm={() => {
          setMobileConfirmed(true)
          p.handlePlace(mobilePending!, () => setMobileConfirmed(false))
        }}
        onHeightChange={setSheetHeight}
      />
    </div>
  )
}

export default GamePageMobile
