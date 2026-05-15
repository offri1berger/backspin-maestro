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
      className={`shrink-0 flex items-center justify-center transition-[width] duration-150 h-24 ${isActive ? 'w-[100px]' : isOver ? 'w-[46px]' : 'w-6'}`}
    >
      {isActive ? (
        <MysteryCardFace />
      ) : isOver ? (
        <div
          className="w-1.5 h-20 rounded-sm bg-good [box-shadow:0_0_20px_var(--color-good),inset_0_0_0_2px_rgba(0,0,0,.3)]"
        />
      ) : (
        <div
          className="w-0.5 h-[60px] [border-left:2px_dashed_var(--color-muted-2)]"
        />
      )}
    </div>
  )
}

export default HSlot
