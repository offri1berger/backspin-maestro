import type { TimelineEntry } from '@hitster/shared'

const MiniYearCard = ({ entry }: { entry: TimelineEntry }) => (
  <div className="card-place-in shrink-0 w-[82px] p-[8px_8px_10px] rounded-[10px] bg-surface text-on-surface">
    <div className="font-display text-[26px] leading-none text-accent tracking-[-0.02em]">
      {entry.song.year}
    </div>
    <div className="text-[9px] font-semibold mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis text-on-surface">
      {entry.song.title}
    </div>
    <div className="font-mono text-[8px] text-muted tracking-[0.05em] whitespace-nowrap overflow-hidden text-ellipsis mt-px">
      {entry.song.artist}
    </div>
  </div>
)

export default MiniYearCard
