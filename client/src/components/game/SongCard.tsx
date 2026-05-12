import { useDraggable } from '@dnd-kit/core'

interface MysteryCardFaceProps {
  fullWidth?: boolean
  hint?: string  // e.g. "between '83 and '92" — shown on the full-width vertical card
}

export const MysteryCardFace = ({ fullWidth = false, hint }: MysteryCardFaceProps) => {
  if (fullWidth) {
    return (
      <div
        style={{
          position: 'relative',
          borderRadius: 18,
          background: 'var(--color-surface)',
          color: 'var(--color-on-surface)',
          padding: '18px 18px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          minHeight: 68,
          userSelect: 'none',
        }}
      >
        {/* diagonal stripe texture */}
        <div
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'repeating-linear-gradient(135deg, transparent 0 18px, rgba(255,255,255,0.025) 18px 36px)',
          }}
        />
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--color-accent)',
            }}
          >
            Mystery card
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)', fontSize: 18,
              lineHeight: 1.1, marginTop: 4,
              color: 'var(--color-on-surface)',
            }}
          >
            {hint ? hint : 'Drag to place'}
          </div>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)', fontSize: 48,
            lineHeight: 1, color: 'var(--color-accent)',
            flexShrink: 0, position: 'relative',
          }}
        >
          ?
        </div>
      </div>
    )
  }

  // Small card — used in desktop HSlot, DragOverlay, spectator preview
  return (
    <div className="shrink-0 w-[82px] p-[8px_8px_10px] rounded-[10px] bg-accent select-none">
      <div className="font-display text-[26px] leading-none text-accent-ink tracking-[-0.02em] opacity-70">
        ?
      </div>
      <div className="text-[9px] font-semibold mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis text-accent-ink">
        mystery
      </div>
      <div className="font-mono text-[8px] text-accent-ink tracking-[0.05em] whitespace-nowrap overflow-hidden text-ellipsis mt-px opacity-65">
        song
      </div>
    </div>
  )
}

interface Props {
  draggable: boolean
  isWaiting: boolean
  fullWidth?: boolean
  hint?: string
}

const SongCard = ({ draggable, isWaiting, fullWidth = false, hint }: Props) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: 'current-song',
    disabled: !draggable || isWaiting,
    attributes: {
      roleDescription: 'Mystery song card. Press space or enter to pick up, arrow keys to move between slots, space or enter to drop, escape to cancel.',
    },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        opacity: isDragging ? 0.3 : 1,
        cursor: draggable ? 'grab' : 'default',
        width: fullWidth ? '100%' : undefined,
        // Stop the browser from interpreting the press as a scroll/zoom/long-tap
        // popup so the TouchSensor's delay can promote it to a drag cleanly.
        touchAction: draggable ? 'none' : undefined,
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        transition: 'transform 120ms ease',
      }}
      className={draggable && !isDragging ? 'active:scale-[0.97]' : undefined}
      {...(draggable ? { ...listeners, ...attributes } : {})}
    >
      <MysteryCardFace fullWidth={fullWidth} hint={hint} />
    </div>
  )
}

export default SongCard
