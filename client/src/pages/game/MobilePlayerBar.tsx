import { useEffect, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { MiniYearCard } from '../../components/game/Timeline'
import { PLAYER_COLORS } from '../../components/game/constants'

interface Props {
  songsToWin: number
}

const MobilePlayerBar: React.FC<Props> = ({ songsToWin }) => {
  const { players, currentPlayerId, disconnectedPlayerIds, playerId } = useGameStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const trapRef = useFocusTrap<HTMLDivElement>(expandedId !== null)

  const expanded = expandedId ? players.find((p) => p.id === expandedId) : null
  const expandedIdx = expanded ? players.indexOf(expanded) : -1

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
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-line bg-bg shrink-0 overflow-x-auto">
        {players.map((p, i) => {
          const active = p.id === currentPlayerId
          const offline = disconnectedPlayerIds.includes(p.id)
          const isMe = p.id === playerId
          const color = PLAYER_COLORS[i % PLAYER_COLORS.length]
          const progress = Math.min(p.timeline.length / songsToWin, 1)
          return (
            <button
              key={p.id}
              onClick={() => setExpandedId(p.id)}
              aria-label={`View ${p.name}'s details`}
              className={`shrink-0 flex items-center gap-2 rounded-full pl-1 pr-3 py-1 transition-all border cursor-pointer ${
                offline ? 'opacity-40' : ''
              } ${
                active
                  ? 'bg-accent text-accent-ink border-accent shadow-[0_2px_12px_color-mix(in_oklch,_var(--color-accent)_40%,_transparent)]'
                  : 'text-on-bg border-line bg-bg-2'
              }`}
            >
              <div className="relative w-7 h-7 shrink-0">
                <svg viewBox="0 0 28 28" className="absolute inset-0 -rotate-90">
                  <circle cx="14" cy="14" r="12" fill="none" stroke={active ? 'rgba(0,0,0,0.18)' : 'var(--color-line)'} strokeWidth="2" />
                  <circle
                    cx="14" cy="14" r="12" fill="none"
                    stroke={active ? 'currentColor' : 'var(--color-accent)'} strokeWidth="2" strokeLinecap="round"
                    strokeDasharray={`${progress * 75.4} 75.4`}
                  />
                </svg>
                <div
                  className="absolute inset-[3px] rounded-full overflow-hidden flex items-center justify-center font-display text-[11px] text-[#1a1612]"
                  style={{ background: color }}
                >
                  {p.avatar
                    ? <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                    : p.name.charAt(0).toUpperCase()
                  }
                </div>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[12px] font-semibold whitespace-nowrap">
                  {p.name}{isMe ? ' (you)' : ''}
                </span>
                <span className={`font-mono text-[9px] tracking-[0.08em] mt-0.5 ${active ? 'opacity-80' : 'text-muted'}`}>
                  {p.timeline.length}/{songsToWin} · {p.tokens}★
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setExpandedId(null) }}
        >
          <div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${expanded.name}'s details`}
            className="sheet-slide-up w-full max-w-[480px] bg-bg-2 rounded-t-[24px] border-t border-line p-5 max-h-[70vh] overflow-y-auto"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-display text-[24px] text-[#1a1612] shrink-0"
                style={{ background: PLAYER_COLORS[expandedIdx % PLAYER_COLORS.length] }}
              >
                {expanded.avatar
                  ? <img src={expanded.avatar} alt="" className="w-full h-full object-cover" />
                  : expanded.name.charAt(0).toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold text-on-bg">
                  {expanded.name}{expanded.id === playerId ? ' (you)' : ''}
                </div>
                <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted mt-0.5">
                  {expanded.timeline.length}/{songsToWin} cards · {expanded.tokens}★
                  {expanded.id === currentPlayerId && ' · their turn'}
                </div>
              </div>
              <button
                onClick={() => setExpandedId(null)}
                aria-label="Close"
                className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer text-muted hover:text-on-bg transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-2">Timeline</div>
            {expanded.timeline.length === 0 ? (
              <p className="text-[12px] text-muted italic">No cards placed yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {expanded.timeline.map((entry, j) => <MiniYearCard key={j} entry={entry} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default MobilePlayerBar
