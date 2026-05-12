import { useState } from 'react'
import type { GamePageProps } from './useGamePage'
import { GameStage } from '../../components/game/GameStage'
import { Logo } from '../../components/ui/Logo'
import MuteToggle from '../../components/ui/MuteToggle'
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
      <div className="px-4 py-2.5 border-b border-line flex items-center justify-between bg-bg shrink-0">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">{p.players.length}p · first to {p.songsToWin}</span>
          <span className="font-mono text-[11px] tracking-[0.18em] text-accent font-semibold">{p.roomCode}</span>
          <MuteToggle />
          <button
            onClick={p.handleLeave}
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted hover:text-on-bg cursor-pointer border-0 bg-transparent p-0 transition-colors"
          >
            Leave
          </button>
        </div>
      </div>

      <MobilePlayerBar />

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
