import { useGameStore } from '../../store/gameStore'
import Sticker from '../boombox/Sticker'
import LedDisplay from '../boombox/LedDisplay'

interface Props {
  guess: { artist: string; title: string }
  onGuessChange: (field: 'artist' | 'title', value: string) => void
  isMyTurn: boolean
  isWaiting: boolean
}

const TOKEN = ({ filled }: { filled: boolean }) => (
  <div
    className={`w-9 h-9 rounded-full flex items-center justify-center font-display text-lg text-accent-ink ${
      filled
        ? '[background:radial-gradient(circle_at_30%_25%,var(--color-accent)_0%,var(--color-accent)_35%,color-mix(in_srgb,var(--color-accent)_50%,#000)_100%)] [box-shadow:inset_0_-3px_6px_rgba(0,0,0,.4),inset_0_2px_4px_rgba(255,255,255,.5),0_3px_0_color-mix(in_srgb,var(--color-accent)_45%,#000),0_0_14px_color-mix(in_srgb,var(--color-accent)_40%,transparent)]'
        : 'bg-[#0a0a0a] [box-shadow:inset_0_2px_4px_rgba(0,0,0,.8)]'
    }`}
  >
    {filled ? '★' : ''}
  </div>
)

export const GuessRail = ({ guess, onGuessChange, isMyTurn, isWaiting }: Props) => {
  const { players, currentPlayerId, playerId, stealResult, placementResult, settings } = useGameStore()
  const songsToWin = settings?.songsPerPlayer ?? 10
  const myPlayer = players.find((p) => p.id === playerId)
  const activePlayer = players.find((p) => p.id === currentPlayerId)
  const disabled = !isMyTurn || isWaiting

  const tokens = myPlayer?.tokens ?? 0

  return (
    <aside
      className="overflow-y-auto p-4 flex flex-col gap-4 bg-[linear-gradient(180deg,#1c1c1f_0%,#0a0a0c_100%)] border-l-2 border-l-black"
    >
      <Sticker color="yellow" rotate={-4} size="sm">BONUS GUESS</Sticker>
      <p className="text-[11px] leading-snug text-[var(--color-muted)]">
        Name artist OR title before placing = <span className="text-accent">+1 ★</span>
      </p>

      <div className="flex flex-col gap-2.5">
        {(['artist', 'title'] as const).map((field) => (
          <input
            key={field}
            placeholder={field === 'artist' ? 'Artist Guess…' : 'Title Guess…'}
            value={guess[field]}
            onChange={(e) => onGuessChange(field, e.target.value)}
            disabled={disabled}
            title={disabled ? 'Not your turn — bonus guesses are only for the active player' : undefined}
            className={`h-[42px] bg-cream text-accent-ink border-2 border-black rounded-[6px] px-3 font-code text-sm outline-none [box-shadow:inset_0_2px_4px_rgba(0,0,0,.2)] ${disabled ? 'opacity-50' : 'opacity-100'}`}
          />
        ))}
      </div>

      <div className="h-0.5 my-1 bg-black" />

      <Sticker color="cyan" rotate={3} size="sm">YOUR TOKENS</Sticker>
      <div className="flex gap-2.5 justify-center">
        {Array.from({ length: Math.max(2, tokens) }).map((_, i) => (
          <TOKEN key={i} filled={i < tokens} />
        ))}
      </div>

      <div className="h-0.5 my-1 bg-black" />

      <Sticker color="hot" rotate={-3} size="sm">ACTION LOG</Sticker>
      <div className="flex flex-col gap-2.5">
        {stealResult && (() => {
          const stealerName = players.find((p) => p.id === stealResult.stealerId)?.name ?? 'Someone'
          return (
            <div className="flex items-start gap-2.5">
              <span
                className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 inline-block ${stealResult.correct ? 'bg-good [box-shadow:0_0_6px_var(--color-good)]' : 'bg-bad [box-shadow:0_0_6px_var(--color-bad)]'}`}
              />
              <div className="text-[12px] leading-snug text-cream">
                <b>{stealerName}</b> {stealResult.correct ? 'stole successfully' : 'failed to steal'}
              </div>
            </div>
          )
        })()}
        {placementResult && (
          <div className="flex items-start gap-2.5">
            <span
              className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 inline-block ${placementResult.correct ? 'bg-good [box-shadow:0_0_6px_var(--color-good)]' : 'bg-bad [box-shadow:0_0_6px_var(--color-bad)]'}`}
            />
            <div className="text-[12px] leading-snug text-cream">
              <b>{activePlayer?.name}</b> {placementResult.correct ? 'placed correctly' : 'missed placement'}
              {placementResult.song && !placementResult.correct && (
                <span className="text-[var(--color-muted)]">
                  {' '}· {placementResult.song.title} ({placementResult.song.year})
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="h-0.5 my-1 bg-black" />

      <Sticker color="cyan" rotate={-3} size="sm">DECK</Sticker>
      <div className="grid grid-cols-2 gap-2">
        {([
          ['PLAYERS', `${players.length}`, 'cyan'],
          ['TO WIN', `${songsToWin}`, 'yellow'],
          ['CARDS', `${myPlayer?.timeline.length ?? 0}`, 'hot'],
          ['★', `${myPlayer?.tokens ?? 0}`, 'green'],
        ] as const).map(([k, v, c]) => (
          <LedDisplay key={k} color={c as 'cyan' | 'yellow' | 'hot' | 'green'} className="text-lg px-2.5 py-1.5">
            <div className="text-[10px] tracking-[.15em]">{k}</div>
            <div>{v}</div>
          </LedDisplay>
        ))}
      </div>
    </aside>
  )
}
