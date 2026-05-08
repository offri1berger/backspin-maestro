import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface Props {
  draggable: boolean
  isWaiting: boolean
}

export const MysteryCardFace = () => (
  <div className="bg-zinc-800 rounded-xl px-4 py-3 flex justify-between items-center">
    <div>
      <p className="font-medium text-sm">mystery song</p>
      <p className="text-zinc-400 text-xs">drag to place</p>
    </div>
    <div className="text-zinc-600 text-2xl">?</div>
  </div>
)

const SongCard = ({ draggable, isWaiting }: Props) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: 'current-song',
    disabled: !draggable || isWaiting,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(draggable ? { ...listeners, ...attributes } : {})}
      className="cursor-grab active:cursor-grabbing"
    >
      <MysteryCardFace />
    </div>
  )
}

export default SongCard