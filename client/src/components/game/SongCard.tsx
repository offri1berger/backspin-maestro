import { useDraggable } from '@dnd-kit/core'

interface MysteryCardFaceProps {
  fullWidth?: boolean
  hint?: string
}

export const MysteryCardFace = ({ fullWidth = false, hint }: MysteryCardFaceProps) => {
  if (fullWidth) {
    return (
      <div
        className="relative overflow-hidden select-none flex items-center gap-3 px-4 py-3"
        style={{
          borderRadius: 12,
          background: 'linear-gradient(180deg, #28282b, #1a1a1c)',
          color: 'var(--color-cream)',
          border: '3px solid #000',
          boxShadow: '0 8px 22px rgba(0,0,0,.5), 0 0 22px color-mix(in srgb, var(--color-hot) 35%, transparent), inset 0 1px 0 rgba(255,255,255,.06)',
          minHeight: 68,
        }}
      >
        <div
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'repeating-linear-gradient(135deg, transparent 0 18px, rgba(255,43,142,0.04) 18px 36px)',
          }}
        />
        <div className="relative">
          <div
            style={{
              fontFamily: 'var(--font-display)', fontSize: 10,
              letterSpacing: '0.1em', color: 'var(--color-hot)',
            }}
          >
            ● MYSTERY HIT
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)', fontSize: 18,
              lineHeight: 1.1, marginTop: 4,
              color: 'var(--color-cream)',
            }}
          >
            {hint ? hint : 'DRAG ONTO SHELF'}
          </div>
        </div>
        <div
          className="ml-auto"
          style={{
            fontFamily: 'var(--font-display)', fontSize: 48, lineHeight: 1,
            color: 'var(--color-accent)',
            textShadow: '3px 3px 0 var(--color-hot), 6px 6px 0 var(--color-accent-ink)',
          }}
        >
          ?
        </div>
      </div>
    )
  }

  // Small card — used in desktop HSlot, DragOverlay, spectator preview
  return (
    <div
      className="shrink-0 select-none"
      style={{
        width: 90,
        background: 'linear-gradient(180deg, var(--color-hot), color-mix(in srgb, var(--color-hot) 60%, #000))',
        borderRadius: 6,
        border: '3px solid #000',
        boxShadow: '0 4px 10px rgba(0,0,0,.5), 0 0 18px color-mix(in srgb, var(--color-hot) 40%, transparent)',
        padding: 5,
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          height: 40,
          background: 'var(--color-cream)',
          borderRadius: 2,
          fontFamily: 'var(--font-display)',
          fontSize: 22, color: 'var(--color-accent-ink)', lineHeight: 1,
        }}
      >
        ?
      </div>
      <div
        className="mt-1 font-display text-center"
        style={{
          fontSize: 9, color: '#fff', letterSpacing: '.05em',
        }}
      >
        MYSTERY
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
