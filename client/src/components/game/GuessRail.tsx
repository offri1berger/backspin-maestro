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
    style={{
      width: 36, height: 36, borderRadius: '50%',
      background: filled
        ? `radial-gradient(circle at 30% 25%, var(--color-accent) 0%, var(--color-accent) 35%, color-mix(in srgb, var(--color-accent) 50%, #000) 100%)`
        : '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--color-accent-ink)',
      boxShadow: filled
        ? 'inset 0 -3px 6px rgba(0,0,0,.4), inset 0 2px 4px rgba(255,255,255,.5), 0 3px 0 color-mix(in srgb, var(--color-accent) 45%, #000), 0 0 14px color-mix(in srgb, var(--color-accent) 40%, transparent)'
        : 'inset 0 2px 4px rgba(0,0,0,.8)',
    }}
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
      className="overflow-y-auto p-4 flex flex-col gap-4"
      style={{
        background: 'linear-gradient(180deg, #1c1c1f 0%, #0a0a0c 100%)',
        borderLeft: '2px solid #000',
      }}
    >
      <Sticker color="yellow" rotate={-4} size="sm">BONUS GUESS</Sticker>
      <p className="text-[11px] leading-snug" style={{ color: 'var(--color-muted)' }}>
        Name artist OR title before placing = <span style={{ color: 'var(--color-accent)' }}>+1 ★</span>
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
            style={{
              height: 42,
              background: 'var(--color-cream)',
              color: 'var(--color-accent-ink)',
              border: '2px solid #000',
              borderRadius: 6,
              padding: '0 12px',
              fontFamily: 'var(--font-code)', fontSize: 14,
              outline: 'none',
              opacity: disabled ? 0.5 : 1,
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,.2)',
            }}
          />
        ))}
      </div>

      <div className="h-0.5 my-1" style={{ background: '#000' }} />

      <Sticker color="cyan" rotate={3} size="sm">YOUR TOKENS</Sticker>
      <div className="flex gap-2.5 justify-center">
        {Array.from({ length: Math.max(2, tokens) }).map((_, i) => (
          <TOKEN key={i} filled={i < tokens} />
        ))}
      </div>

      <div className="h-0.5 my-1" style={{ background: '#000' }} />

      <Sticker color="hot" rotate={-3} size="sm">ACTION LOG</Sticker>
      <div className="flex flex-col gap-2.5">
        {stealResult && (() => {
          const stealerName = players.find((p) => p.id === stealResult.stealerId)?.name ?? 'Someone'
          return (
            <div className="flex items-start gap-2.5">
              <span
                className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 inline-block"
                style={{ background: stealResult.correct ? 'var(--color-good)' : 'var(--color-bad)', boxShadow: `0 0 6px ${stealResult.correct ? 'var(--color-good)' : 'var(--color-bad)'}` }}
              />
              <div className="text-[12px] leading-snug" style={{ color: 'var(--color-cream)' }}>
                <b>{stealerName}</b> {stealResult.correct ? 'stole successfully' : 'failed to steal'}
              </div>
            </div>
          )
        })()}
        {placementResult && (
          <div className="flex items-start gap-2.5">
            <span
              className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 inline-block"
              style={{ background: placementResult.correct ? 'var(--color-good)' : 'var(--color-bad)', boxShadow: `0 0 6px ${placementResult.correct ? 'var(--color-good)' : 'var(--color-bad)'}` }}
            />
            <div className="text-[12px] leading-snug" style={{ color: 'var(--color-cream)' }}>
              <b>{activePlayer?.name}</b> {placementResult.correct ? 'placed correctly' : 'missed placement'}
              {placementResult.song && !placementResult.correct && (
                <span style={{ color: 'var(--color-muted)' }}>
                  {' '}· {placementResult.song.title} ({placementResult.song.year})
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="h-0.5 my-1" style={{ background: '#000' }} />

      <Sticker color="cyan" rotate={-3} size="sm">DECK</Sticker>
      <div className="grid grid-cols-2 gap-2">
        {([
          ['PLAYERS', `${players.length}`, 'cyan'],
          ['TO WIN', `${songsToWin}`, 'yellow'],
          ['CARDS', `${myPlayer?.timeline.length ?? 0}`, 'hot'],
          ['★', `${myPlayer?.tokens ?? 0}`, 'green'],
        ] as const).map(([k, v, c]) => (
          <LedDisplay key={k} color={c as 'cyan' | 'yellow' | 'hot' | 'green'} style={{ fontSize: 18, padding: '6px 10px' }}>
            <div style={{ fontSize: 10, letterSpacing: '.15em' }}>{k}</div>
            <div>{v}</div>
          </LedDisplay>
        ))}
      </div>
    </aside>
  )
}
