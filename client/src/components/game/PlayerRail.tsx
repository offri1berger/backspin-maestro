import { useGameStore } from '../../store/gameStore'
import Sticker from '../boombox/Sticker'
import PolaroidAvatar from '../boombox/PolaroidAvatar'

export const PlayerRail = () => {
  const { players, currentPlayerId, playerId, disconnectedPlayerIds, settings } = useGameStore()
  const songsToWin = settings?.songsPerPlayer ?? 10

  return (
    <aside
      className="overflow-y-auto p-4 flex flex-col gap-3"
      style={{
        background: 'linear-gradient(180deg, #1c1c1f 0%, #0a0a0c 100%)',
        borderRight: '2px solid #000',
      }}
    >
      <Sticker color="cyan" rotate={-4} size="sm">THE CREW</Sticker>

      <div className="flex flex-col gap-2.5 mt-2">
        {players.map((p, i) => {
          const active = p.id === currentPlayerId
          const isMe = p.id === playerId
          const offline = disconnectedPlayerIds.includes(p.id)
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 p-2.5 rounded-[8px]"
              style={{
                opacity: offline ? 0.4 : 1,
                background: active
                  ? `linear-gradient(135deg, color-mix(in srgb, var(--color-hot) 25%, transparent), transparent)`
                  : '#1a1a1c',
                border: active ? '2px solid var(--color-hot)' : '2px solid transparent',
                transition: 'all .15s',
              }}
            >
              <PolaroidAvatar
                src={p.avatar}
                fallback={p.name.charAt(0)}
                size={36}
                rotate={i % 2 ? -3 : 3}
                active={active}
              />
              <div className="flex-1 min-w-0">
                <div
                  className="font-display"
                  style={{ fontSize: 13, color: 'var(--color-cream)' }}
                >
                  {p.name}{isMe ? ' (YOU)' : ''}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: Math.min(10, songsToWin) }).map((_, k) => {
                    const filled = k < p.timeline.length
                    return (
                      <div
                        key={k}
                        style={{
                          width: 4, height: 12,
                          background: filled ? 'var(--color-accent)' : '#0a0a0a',
                          boxShadow: filled ? '0 0 4px var(--color-accent)' : 'inset 0 0 0 1px rgba(255,255,255,.05)',
                          borderRadius: 1,
                        }}
                      />
                    )
                  })}
                </div>
                <div
                  className="font-mono mt-1"
                  style={{ fontSize: 12, color: 'var(--color-muted)', letterSpacing: '.05em' }}
                >
                  {p.timeline.length}/{songsToWin} · {'★'.repeat(Math.max(0, p.tokens))}{'·'.repeat(Math.max(0, 2 - p.tokens))} TOKENS
                </div>
              </div>
              {active && (
                <span
                  className="font-display"
                  style={{ fontSize: 9, color: 'var(--color-hot)', letterSpacing: '.15em' }}
                >
                  NOW
                </span>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
