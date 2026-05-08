import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface Props {
  draggable: boolean
  isWaiting: boolean
}

// Mini mystery card shown inside timeline slots (82px wide)
export const MysteryCardFace = () => (
  <div style={{
    flexShrink: 0,
    width: 82,
    padding: '8px 8px 10px',
    borderRadius: 10,
    background: 'var(--surface)',
    color: 'var(--on-surface)',
    border: '1.5px dashed var(--accent)',
    position: 'relative',
    overflow: 'hidden',
    userSelect: 'none',
  }}>
    <div style={{
      position: 'absolute', inset: 0,
      background: 'repeating-linear-gradient(135deg, transparent 0 8px, rgba(255,255,255,0.04) 8px 16px)',
      pointerEvents: 'none',
    }} />
    <div style={{
      fontFamily: 'var(--font-display)',
      fontSize: 26, lineHeight: 1,
      color: 'var(--accent)',
      position: 'relative',
    }}>?</div>
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 8,
      color: 'var(--muted)',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      marginTop: 6,
      position: 'relative',
    }}>mystery</div>
  </div>
)

// Larger draggable mystery card shown at the bottom of the page
const MysteryCardLarge = () => (
  <div style={{
    padding: '16px 20px',
    borderRadius: 16,
    background: 'var(--surface)',
    color: 'var(--on-surface)',
    border: '1.5px dashed var(--accent)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  }}>
    <div style={{
      position: 'absolute', inset: 0,
      background: 'repeating-linear-gradient(135deg, transparent 0 18px, rgba(255,255,255,0.025) 18px 36px)',
      pointerEvents: 'none',
    }} />
    <div style={{
      fontFamily: 'var(--font-display)',
      fontSize: 48, lineHeight: 1,
      color: 'var(--accent)',
      position: 'relative',
      flexShrink: 0,
    }}>?</div>
    <div style={{ position: 'relative' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--on-surface)' }}>
        mystery song
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 4, letterSpacing: '0.05em' }}>
        drag to place on your timeline
      </div>
    </div>
  </div>
)

const SongCard = ({ draggable, isWaiting }: Props) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: 'current-song',
    disabled: !draggable || isWaiting,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        cursor: draggable ? 'grab' : 'default',
      }}
      {...(draggable ? { ...listeners, ...attributes } : {})}
    >
      <MysteryCardLarge />
    </div>
  )
}

export default SongCard
