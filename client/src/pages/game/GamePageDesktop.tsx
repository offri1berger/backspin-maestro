import type { GamePageProps } from './useGamePage'
import { PlayerRail } from '../../components/game/PlayerRail'
import { GuessRail } from '../../components/game/GuessRail'
import { GameStage } from '../../components/game/GameStage'
import { Logo } from '../../components/ui/Logo'
import StealPill from './StealPill'

const GamePageDesktop = (p: GamePageProps) => (
  <div className="hidden lg:flex flex-col flex-1 min-h-0">
    <div className="px-7 py-4 border-b border-line flex items-center justify-between bg-bg shrink-0">
      <div className="flex items-center gap-6">
        <Logo />
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">Room</span>
        <span className="font-mono text-base tracking-[0.18em] text-accent font-semibold">{p.roomCode}</span>
        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">{p.players.length} players</span>
      </div>
      <div className="flex items-center gap-6">
        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">First to {p.songsToWin} cards wins</span>
        <button
          onClick={p.handleLeave}
          className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted hover:text-on-bg cursor-pointer border-0 bg-transparent p-0 transition-colors"
        >
          Leave
        </button>
      </div>
    </div>

    <div className="flex-1 grid min-h-0 grid-cols-[260px_1fr_300px]">
      <PlayerRail />
      <GameStage onPlace={p.handlePlace} onSkip={p.handleSkip} />
      <GuessRail
        guess={p.guess}
        onGuessChange={p.onGuessChange}
        isMyTurn={p.isMyTurn}
        isWaiting={p.isWaitingForNextTurn}
      />
    </div>

    {p.isStealWindowOpen && <StealPill stealerName={p.stealerName} countdown={p.countdown} />}

    {p.canSteal && (
      <button
        onClick={p.handleStealInitiate}
        className="fixed bottom-6 right-6 z-30 px-5 py-3 rounded-full bg-accent text-accent-ink border-0 cursor-pointer font-body font-bold text-sm shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
      >
        Steal! · 1 ★
      </button>
    )}
  </div>
)

export default GamePageDesktop
