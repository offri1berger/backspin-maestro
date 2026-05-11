import type { Player } from '@hitster/shared'
import { useGameStore } from '../../store/gameStore'
import { ArrowIcon, Logo } from '../ui/Logo'
import socket from '../../socket'

function PlayerRow({
  player,
  offline,
  canKick,
}: {
  player: Player
  offline: boolean
  canKick: boolean
}) {
  const handleKick = () => {
    if (!window.confirm(`Remove ${player.name} from the room?`)) return
    socket.emit('conductor:kick', { playerId: player.id }, (error) => {
      if (error) console.error('kick error:', error)
    })
  }

  return (
    <div className={`flex items-center gap-3.5 px-[18px] py-3.5 rounded-2xl border border-line transition-opacity ${offline ? 'opacity-40' : ''}`}>
      {player.avatar
        ? <img src={player.avatar} alt={player.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
        : <div className="w-9 h-9 rounded-full bg-line flex items-center justify-center font-display text-[20px] text-on-bg shrink-0">{player.name.charAt(0).toUpperCase()}</div>
      }
      <span className="flex-1 text-base font-semibold text-on-bg">{player.name}</span>
      {offline && <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">offline</span>}
      {!offline && player.isHost && <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">conductor</span>}
      {canKick && (
        <button
          onClick={handleKick}
          aria-label={`Remove ${player.name}`}
          className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted hover:text-bad transition-colors cursor-pointer bg-transparent border-0 p-0"
        >
          remove
        </button>
      )}
    </div>
  )
}

interface Props {
  roomCode: string
  players: Player[]
  onStart: () => void
  onLeave: () => void
}

export function WaitingRoom({ roomCode, players, onStart, onLeave }: Props) {
  const disconnectedPlayerIds = useGameStore((s) => s.disconnectedPlayerIds)
  const playerId = useGameStore((s) => s.playerId)
  const isHost = players.find((p) => p.id === playerId)?.isHost ?? false
  const ready = players.length >= 2

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="px-5 lg:px-10 py-5 border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onLeave}
            className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.15em] uppercase text-muted hover:text-on-bg transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Leave
          </button>
          <div className="w-px h-4 bg-line" />
          <Logo />
        </div>
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
            {players.map((p) => (
              <PlayerRow
                key={p.id}
                player={p}
                offline={disconnectedPlayerIds.includes(p.id)}
                canKick={isHost && p.id !== playerId}
              />
            ))}
          </div>

          {isHost ? (
            <>
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
            </>
          ) : (
            <p className="text-center font-mono text-[10px] tracking-[0.15em] uppercase text-muted">
              {ready ? 'waiting for the conductor to start…' : 'waiting for more players…'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
