import { useGameStore } from '../../store/gameStore'
import { SectionMark } from './common'

interface Props {
  guess: { artist: string; title: string }
  onGuessChange: (field: 'artist' | 'title', value: string) => void
  isMyTurn: boolean
  isWaiting: boolean
}

export const GuessRail = ({ guess, onGuessChange, isMyTurn, isWaiting }: Props) => {
  const { players, currentPlayerId, playerId, stealResult, placementResult } = useGameStore()
  const myPlayer = players.find((p) => p.id === playerId)
  const activePlayer = players.find((p) => p.id === currentPlayerId)
  const disabled = !isMyTurn || isWaiting

  return (
    <aside className="p-5 border-l border-line overflow-y-auto bg-bg">
      <SectionMark>Bonus guess</SectionMark>
      <p className="text-xs text-muted mt-2 leading-snug">
        Optional. Fill in before placing — submitted with your card.
      </p>

      <div className="flex flex-col gap-2.5 mt-3.5">
        {(['artist', 'title'] as const).map((field) => (
          <input
            key={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={guess[field]}
            onChange={(e) => onGuessChange(field, e.target.value)}
            disabled={disabled}
            className={`h-11 rounded-xl border border-line bg-transparent text-on-bg px-3.5 text-sm font-body outline-none ${disabled ? 'opacity-40' : 'opacity-100'}`}
          />
        ))}
      </div>

      <div className="mt-7">
        <SectionMark>Action log</SectionMark>
        <div className="mt-3 flex flex-col gap-2.5">
          {stealResult && (() => {
            const stealerName = players.find((p) => p.id === stealResult.stealerId)?.name ?? 'Someone'
            return (
              <div className="flex items-start gap-2.5">
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 inline-block"
                  style={{ background: stealResult.correct ? 'var(--color-good)' : 'var(--color-bad)' }}
                />
                <div className="text-xs leading-snug text-on-bg">
                  <b>{stealerName}</b> {stealResult.correct ? 'stole successfully' : 'failed to steal'}
                </div>
              </div>
            )
          })()}
          {placementResult && (
            <div className="flex items-start gap-2.5">
              <span
                className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 inline-block"
                style={{ background: placementResult.correct ? 'var(--color-good)' : 'var(--color-bad)' }}
              />
              <div className="text-xs leading-snug text-on-bg">
                <b>{activePlayer?.name}</b> {placementResult.correct ? 'placed correctly' : 'missed placement'}
                {placementResult.song && !placementResult.correct && (
                  <span className="text-muted">
                    {' '}· {placementResult.song.title} ({placementResult.song.year})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-7 p-[14px_16px] border border-line rounded-2xl">
        <SectionMark>Deck</SectionMark>
        <div className="grid grid-cols-2 gap-2.5 mt-3">
          {([
            ['Players', `${players.length}`],
            ['Cards needed', '10'],
            ['Your cards', `${myPlayer?.timeline.length ?? 0}`],
            ['Your ★', `${myPlayer?.tokens ?? 0}`],
          ] as const).map(([k, v]) => (
            <div key={k}>
              <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-muted">{k}</div>
              <div className="font-display text-[22px] text-accent mt-0.5 leading-none">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
