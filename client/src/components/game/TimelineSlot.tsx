import { useDroppable } from '@dnd-kit/core'
import type { ReactNode } from 'react'

interface Props {
  id: number
  isSelected: boolean
  preview?: ReactNode
}

const TimelineSlot = ({ id, isSelected, preview }: Props) => {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div ref={setNodeRef}>
      {preview ?? (
        <div
          className={`h-8 rounded-lg border-2 border-dashed transition-colors ${
            isOver ? 'border-white bg-zinc-700' :
            isSelected ? 'border-green-400 bg-green-900/30' :
            'border-zinc-700'
          }`}
        />
      )}
    </div>
  )
}

export default TimelineSlot