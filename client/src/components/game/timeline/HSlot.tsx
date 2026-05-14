import { useDroppable } from '@dnd-kit/core'
import { MysteryCardFace } from '../SongCard'

interface HSlotProps {
  id: number
  isActive: boolean
  label?: string
}

const HSlot = ({ id, isActive, label }: HSlotProps) => {
  const { isOver, setNodeRef } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      role="region"
      aria-label={label ?? `Timeline slot ${id + 1}`}
      className="shrink-0 flex items-center justify-center transition-[width] duration-150"
      style={{ width: isActive ? 100 : isOver ? 46 : 24, height: 96 }}
    >
      {isActive ? (
        <MysteryCardFace />
      ) : isOver ? (
        <div
          style={{
            width: 6, height: 80, borderRadius: 2,
            background: 'var(--color-good)',
            boxShadow: '0 0 20px var(--color-good), inset 0 0 0 2px rgba(0,0,0,.3)',
          }}
        />
      ) : (
        <div
          style={{
            width: 2, height: 60,
            borderLeft: '2px dashed var(--color-muted-2)',
          }}
        />
      )}
    </div>
  )
}

export default HSlot
