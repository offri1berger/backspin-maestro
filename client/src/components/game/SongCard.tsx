import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

// Mystery card — same dimensions as MiniYearCard, accent background to distinguish from revealed cards
export const MysteryCardFace = () => (
  <div style={{
    flexShrink: 0,
    width: 82,
    padding: '8px 8px 10px',
    borderRadius: 10,
    background: 'var(--accent)',
    userSelect: 'none',
  }}>
    <div style={{
      fontFamily: 'var(--font-display)',
      fontSize: 26, lineHeight: 1,
      color: 'var(--accent-ink)',
      letterSpacing: '-0.02em',
      opacity: 0.7,
    }}>?</div>
    <div style={{
      fontSize: 9, fontWeight: 600, marginTop: 6,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      color: 'var(--accent-ink)',
    }}>mystery</div>
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 8,
      color: 'var(--accent-ink)',
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      marginTop: 1,
      opacity: 0.65,
    }}>song</div>
  </div>
)

interface Props {
  draggable: boolean
  isWaiting: boolean
}

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
      <MysteryCardFace />
    </div>
  )
}

export default SongCard
