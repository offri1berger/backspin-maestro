import type { TimelineEntry } from '@backspin-maestro/shared'

const COLORS = ['var(--color-hot)', 'var(--color-cyan)', 'var(--color-accent)', 'var(--color-orange)']

const MiniYearCard = ({ entry, index = 0 }: { entry: TimelineEntry; index?: number }) => {
  const col = COLORS[index % COLORS.length]
  const rotate = ((index % 3) - 1) * 1.5
  return (
    <div
      className="card-place-in shrink-0"
      style={{
        width: 88,
        transform: `rotate(${rotate}deg)`,
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.4))',
      }}
    >
      {/* Cassette body */}
      <div
        style={{
          height: 54,
          position: 'relative',
          background: `linear-gradient(180deg, ${col}, color-mix(in srgb, ${col} 65%, #000))`,
          borderRadius: 4,
          boxShadow: 'inset 0 0 0 2px rgba(0,0,0,.3), 0 2px 4px rgba(0,0,0,.4)',
        }}
      >
        <div
          style={{
            position: 'absolute', left: '8%', right: '8%', top: '12%', height: '40%',
            background: 'var(--color-cream)', borderRadius: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span
            className="font-display"
            style={{ fontSize: 12, color: 'var(--color-accent-ink)', lineHeight: 1 }}
          >
            {entry.song.year}
          </span>
        </div>
        <div
          style={{
            position: 'absolute', left: '15%', bottom: '14%', width: 11, height: 11,
            borderRadius: '50%', background: '#000',
            boxShadow: `inset 0 0 0 3px ${col}`,
          }}
        />
        <div
          style={{
            position: 'absolute', right: '15%', bottom: '14%', width: 11, height: 11,
            borderRadius: '50%', background: '#000',
            boxShadow: `inset 0 0 0 3px ${col}`,
          }}
        />
      </div>
      {/* Label tape */}
      <div
        className="mt-1 text-center px-1 py-0.5"
        style={{
          background: 'var(--color-cream)',
          color: 'var(--color-accent-ink)',
        }}
      >
        <div
          className="font-display whitespace-nowrap overflow-hidden text-ellipsis"
          style={{ fontSize: 9, lineHeight: 1.2 }}
        >
          {entry.song.title}
        </div>
        <div
          className="font-mono whitespace-nowrap overflow-hidden text-ellipsis"
          style={{ fontSize: 11, color: 'var(--color-muted-2)', lineHeight: 1 }}
        >
          {entry.song.artist}
        </div>
      </div>
    </div>
  )
}

export default MiniYearCard
