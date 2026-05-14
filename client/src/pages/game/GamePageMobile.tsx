import { useState } from 'react'
import type { GamePageProps } from './useGamePage'
import { GameStage } from '../../components/game/GameStage'
import { Logo } from '../../components/ui/Logo'
import MobilePlayerBar from './MobilePlayerBar'
import MobileBottomSheet from './MobileBottomSheet'

const GamePageMobile = (p: GamePageProps) => {
  const [mobilePending, _setMobilePending] = useState<number | null>(null)
  const [mobileConfirmed, setMobileConfirmed] = useState(false)
  const [sheetHeight, setSheetHeight] = useState(320)
  const setMobilePending = (val: number | null) => {
    _setMobilePending(val)
    if (val === null) setMobileConfirmed(false)
  }

  return (
    <div className="flex flex-col lg:hidden min-h-dvh">
      <div className="px-4 py-2 border-b border-line flex items-center justify-between bg-bg shrink-0">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="font-mono text-[10px] tracking-[0.16em] text-accent font-semibold">
            · {p.roomCode}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={p.handleLeave}
            aria-label="Leave room"
            className="w-9 h-9 flex items-center justify-center text-muted hover:text-on-bg cursor-pointer border-0 bg-transparent transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M10 5l3 3-3 3M13 8H6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <MobilePlayerBar songsToWin={p.songsToWin} />

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
