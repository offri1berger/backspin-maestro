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
      className="shrink-0 h-[90px] flex items-center justify-center transition-[width] duration-[180ms] ease-in-out"
      style={{ width: isActive ? 96 : isOver ? 40 : 28 }}
    >
      {isActive ? (
        <MysteryCardFace />
      ) : isOver ? (
        <div
          className="w-1 h-20 rounded-full bg-accent"
          style={{ boxShadow: '0 0 12px var(--color-accent)' }}
        />
      ) : (
        <div className="w-px h-16 border-l-[1.5px] border-dashed border-line transition-colors duration-150" />
      )}
    </div>
  )
}

export default HSlot
