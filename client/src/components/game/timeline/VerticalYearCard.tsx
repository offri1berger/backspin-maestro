import type { TimelineEntry } from '@backspin-maestro/shared'

const VerticalYearCard = ({ entry }: { entry: TimelineEntry }) => (
  <div className="card-place-in flex items-center gap-[14px] overflow-hidden min-h-[68px] rounded-[18px] px-[18px] py-[14px] bg-surface text-on-surface">
    <div className="font-display text-[38px] leading-none tracking-[-0.03em] text-accent shrink-0 w-[86px]">
      {entry.song.year}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-sm overflow-hidden text-ellipsis whitespace-nowrap">
        {entry.song.title}
      </div>
      <div className="text-xs text-muted font-mono tracking-[0.02em] overflow-hidden text-ellipsis whitespace-nowrap mt-0.5">
        {entry.song.artist}
      </div>
    </div>
  </div>
)

export default VerticalYearCard
