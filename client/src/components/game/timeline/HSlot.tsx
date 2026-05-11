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
      style={{ width: isActive ? 96 : 28 }}
    >
      {isActive ? (
        <MysteryCardFace />
      ) : (
        <div className={`w-px h-16 border-l-[1.5px] border-dashed transition-colors duration-150 ${isOver ? 'border-accent' : 'border-line'}`} />
      )}
    </div>
  )
}

export default HSlot
