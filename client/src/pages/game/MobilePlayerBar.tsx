import { useEffect, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { MiniYearCard } from '../../components/game/Timeline'
import PolaroidAvatar from '../../components/boombox/PolaroidAvatar'
import Sticker from '../../components/boombox/Sticker'

interface Props {
  songsToWin: number
}

const MobilePlayerBar: React.FC<Props> = ({ songsToWin }) => {
  const { players, currentPlayerId, disconnectedPlayerIds, playerId } = useGameStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const trapRef = useFocusTrap<HTMLDivElement>(expandedId !== null)

  const expanded = expandedId ? players.find((p) => p.id === expandedId) : null

  useEffect(() => {
    if (!expandedId) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpandedId(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [expandedId])

  return (
    <>
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 overflow-x-auto no-scrollbar shrink-0 bg-[#1a1a1c] border-b-2 border-[#000]"
      >
        {players.map((p, i) => {
          const active = p.id === currentPlayerId
          const offline = disconnectedPlayerIds.includes(p.id)
          const isMe = p.id === playerId
          return (
            <button
              key={p.id}
              onClick={() => setExpandedId(p.id)}
              aria-label={`View ${p.name}'s details`}
              className={`shrink-0 flex flex-col items-center gap-1 bg-transparent border-0 p-0 cursor-pointer ${offline ? 'opacity-40' : 'opacity-100'}`}
            >
              <PolaroidAvatar
                src={p.avatar}
                fallback={p.name.charAt(0)}
                size={42}
                rotate={i % 2 ? -3 : 3}
                active={active}
              />
              <span
                className={`font-display text-[10px] tracking-[.05em] ${active ? 'text-accent' : 'text-cream'}`}
              >
                {p.timeline.length}/{songsToWin}{isMe ? ' YOU' : ''}
              </span>
            </button>
          )
        })}
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(0,0,0,0.72)] [backdrop-filter:blur(6px)]"
          onClick={(e) => { if (e.target === e.currentTarget) setExpandedId(null) }}
        >
          <div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${expanded.name}'s details`}
            className="sheet-slide-up w-full max-w-[480px] brushed-darker p-5 max-h-[70vh] overflow-y-auto rounded-tl-[18px] rounded-tr-[18px] border-t-2 border-[#0a0a0a] pb-[calc(env(safe-area-inset-bottom,0px)+20px)] [box-shadow:0_-10px_30px_rgba(0,0,0,.6)]"
          >
            <div className="flex items-center gap-3 mb-4">
              <PolaroidAvatar
                src={expanded.avatar}
                fallback={expanded.name.charAt(0)}
                size={56}
                rotate={-4}
                active
              />
              <div className="flex-1 min-w-0">
                <div className="font-display text-base text-cream">
                  {expanded.name}{expanded.id === playerId ? ' (YOU)' : ''}
                </div>
                <div
                  className="font-mono mt-0.5 text-[13px] text-[var(--color-muted)] tracking-[.05em]"
                >
                  {expanded.timeline.length}/{songsToWin} CARDS · {expanded.tokens}★
                  {expanded.id === currentPlayerId && ' · THEIR TURN'}
                </div>
              </div>
              <button
                onClick={() => setExpandedId(null)}
                aria-label="Close"
                className="w-9 h-9 flex items-center justify-center bg-transparent border-0 cursor-pointer text-cream"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <Sticker color="yellow" rotate={-3} size="sm">TIMELINE</Sticker>
            <div className="mt-2.5">
              {expanded.timeline.length === 0 ? (
                <p
                  className="text-xs italic text-[var(--color-muted)]"
                >
                  No cards placed yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {expanded.timeline.map((entry, j) => <MiniYearCard key={j} entry={entry} index={j} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MobilePlayerBar
