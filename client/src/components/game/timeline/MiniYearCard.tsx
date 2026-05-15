import type { TimelineEntry } from '@backspin-maestro/shared'

const COLORS = ['var(--color-hot)', 'var(--color-cyan)', 'var(--color-accent)', 'var(--color-orange)']

const MiniYearCard = ({ entry, index = 0 }: { entry: TimelineEntry; index?: number }) => {
  const col = COLORS[index % COLORS.length]
  const rotate = ((index % 3) - 1) * 1.5
  return (
    <div
      className="card-place-in shrink-0 w-[88px] [filter:drop-shadow(0_4px_8px_rgba(0,0,0,.4))]"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {/* Cassette body */}
      <div
        className="h-[54px] relative rounded [box-shadow:inset_0_0_0_2px_rgba(0,0,0,.3),0_2px_4px_rgba(0,0,0,.4)]"
        style={{ background: `linear-gradient(180deg, ${col}, color-mix(in srgb, ${col} 65%, #000))` }}
      >
        <div
          className="absolute left-[8%] right-[8%] top-[12%] h-[40%] bg-cream rounded-sm flex items-center justify-center"
        >
          <span
            className="font-display text-xs text-accent-ink leading-none"
          >
            {entry.song.year}
          </span>
        </div>
        <div
          className="absolute left-[15%] bottom-[14%] w-[11px] h-[11px] rounded-full bg-black"
          style={{ boxShadow: `inset 0 0 0 3px ${col}` }}
        />
        <div
          className="absolute right-[15%] bottom-[14%] w-[11px] h-[11px] rounded-full bg-black"
          style={{ boxShadow: `inset 0 0 0 3px ${col}` }}
        />
      </div>
      {/* Label tape */}
      <div
        className="mt-1 text-center px-1 py-0.5 bg-cream text-accent-ink"
      >
        <div
          className="font-display whitespace-nowrap overflow-hidden text-ellipsis text-[9px] leading-[1.2]"
        >
          {entry.song.title}
        </div>
        <div
          className="font-mono whitespace-nowrap overflow-hidden text-ellipsis text-[11px] text-[var(--color-muted-2)] leading-none"
        >
          {entry.song.artist}
        </div>
      </div>
    </div>
  )
}

export default MiniYearCard
