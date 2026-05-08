import { useDroppable } from '@dnd-kit/core'

interface Props {
  id: number
}

const TimelineSlot = ({ id }: Props) => {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`h-8 rounded-lg border-2 border-dashed transition-colors ${
        isOver ? 'border-white bg-zinc-700' : 'border-zinc-700'
      }`}
    />
  )
}

export default TimelineSlot