import { useDroppable } from '@dnd-kit/core'

interface Props {
  id: number
  isSelected: boolean
}

const TimelineSlot = ({ id, isSelected }: Props) => {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`h-8 rounded-lg border-2 border-dashed transition-colors ${
        isOver ? 'border-white bg-zinc-700' :
        isSelected ? 'border-green-400 bg-green-900/30' :
        'border-zinc-700'
      }`}
    />
  )
}

export default TimelineSlot