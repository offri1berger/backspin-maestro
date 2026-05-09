import type { Player } from '@hitster/shared'
import { Logo, ArrowIcon } from './Logo'

function PlayerRow({ player }: { player: Player }) {
  return (
    <div className="flex items-center gap-3.5 px-[18px] py-3.5 rounded-2xl border border-line">
      {player.avatar
        ? <img src={player.avatar} alt={player.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
        : <div className="w-9 h-9 rounded-full bg-line flex items-center justify-center font-display text-[20px] text-on-bg shrink-0">{player.name.charAt(0).toUpperCase()}</div>
      }
      <span className="flex-1 text-base font-semibold text-on-bg">{player.name}</span>
      {player.isHost && (
        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">host</span>
      )}
    </div>
  )
}

interface Props {
  roomCode: string
  players: Player[]
  onStart: () => void
}

export function WaitingRoom({ roomCode, players, onStart }: Props) {
  const ready = players.length >= 2

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="px-5 lg:px-10 py-5 border-b border-line flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">Room</span>
          <span className="font-mono text-[20px] tracking-[0.18em] text-accent font-semibold">{roomCode}</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-5 lg:p-10">
        <div className="w-full max-w-[480px]">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">
              Players ({players.length}/6)
            </span>
          </div>

          <div className="flex flex-col gap-2 mb-8">
            {players.map((p) => <PlayerRow key={p.id} player={p} />)}
          </div>

          <button
            onClick={onStart}
            disabled={!ready}
            className={`w-full h-[60px] rounded-full border-none flex items-center justify-center gap-2.5 font-body font-semibold text-[17px] transition-colors duration-150 ${
              ready
                ? 'bg-accent text-accent-ink cursor-pointer'
                : 'bg-line text-muted cursor-not-allowed'
            }`}
          >
            Cut the deck
            <ArrowIcon />
          </button>

          {!ready && (
            <p className="text-center mt-3 font-mono text-[10px] tracking-[0.15em] uppercase text-muted">
              waiting for more players…
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
