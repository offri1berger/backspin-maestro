import type { TimelineEntry } from '@backspin-maestro/shared'

const COLORS = ['var(--color-hot)', 'var(--color-cyan)', 'var(--color-accent)', 'var(--color-orange)']

const VerticalYearCard = ({ entry, index = 0 }: { entry: TimelineEntry; index?: number }) => {
  const col = COLORS[index % COLORS.length]
  return (
    <div
      className="card-place-in flex items-center gap-3 overflow-hidden min-h-[64px] px-4 py-3 rounded-lg bg-[linear-gradient(180deg,#28282b,#1a1a1c)] border-2 border-[#0a0a0a] [box-shadow:0_4px_12px_rgba(0,0,0,.5),inset_0_1px_0_rgba(255,255,255,.04)]"
    >
      <div
        className="font-display shrink-0 w-[72px] text-center py-1.5 text-[22px] leading-none"
        style={{ color: col, textShadow: `2px 2px 0 var(--color-accent-ink)` }}
      >
        {entry.song.year}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="font-display overflow-hidden text-ellipsis whitespace-nowrap text-sm text-cream"
        >
          {entry.song.title}
        </div>
        <div
          className="font-mono overflow-hidden text-ellipsis whitespace-nowrap mt-0.5 text-sm text-[var(--color-muted)]"
        >
          {entry.song.artist}
        </div>
      </div>
    </div>
  )
}

export default VerticalYearCard
