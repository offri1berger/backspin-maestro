import { useGameStore } from '../../store/gameStore'
import Sticker from '../boombox/Sticker'
import PolaroidAvatar from '../boombox/PolaroidAvatar'

export const PlayerRail = () => {
  const { players, currentPlayerId, playerId, disconnectedPlayerIds, settings } = useGameStore()
  const songsToWin = settings?.songsPerPlayer ?? 10

  return (
    <aside
      className="overflow-y-auto p-4 flex flex-col gap-3 bg-[linear-gradient(180deg,#1c1c1f_0%,#0a0a0c_100%)] border-r-2 border-[#000]"
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
              className={`flex items-center gap-3 p-2.5 rounded-[8px] transition-all duration-[150ms] ${offline ? 'opacity-40' : 'opacity-100'} ${active ? 'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-hot)_25%,transparent),transparent)] border-2 border-hot' : 'bg-[#1a1a1c] border-2 border-transparent'}`}
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
                  className="font-display text-[13px] text-cream"
                >
                  {p.name}{isMe ? ' (YOU)' : ''}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: Math.min(10, songsToWin) }).map((_, k) => {
                    const filled = k < p.timeline.length
                    return (
                      <div
                        key={k}
                        className={`w-1 h-3 rounded-[1px] ${filled ? 'bg-accent [box-shadow:0_0_4px_var(--color-accent)]' : 'bg-[#0a0a0a] [box-shadow:inset_0_0_0_1px_rgba(255,255,255,.05)]'}`}
                      />
                    )
                  })}
                </div>
                <div
                  className="font-mono mt-1 text-xs text-[var(--color-muted)] tracking-[.05em]"
                >
                  {p.timeline.length}/{songsToWin} · {'★'.repeat(Math.max(0, p.tokens))}{'·'.repeat(Math.max(0, 2 - p.tokens))} TOKENS
                </div>
              </div>
              {active && (
                <span
                  className="font-display text-[9px] text-hot tracking-[.15em]"
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
