import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

// Mystery card — same dimensions as MiniYearCard, accent background to distinguish from revealed cards
export const MysteryCardFace = () => (
  <div className="shrink-0 w-[82px] p-[8px_8px_10px] rounded-[10px] bg-accent select-none">
    <div className="font-display text-[26px] leading-none text-accent-ink tracking-[-0.02em] opacity-70">
      ?
    </div>
    <div className="text-[9px] font-semibold mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis text-accent-ink">
      mystery
    </div>
    <div className="font-mono text-[8px] text-accent-ink tracking-[0.05em] whitespace-nowrap overflow-hidden text-ellipsis mt-px opacity-65">
      song
    </div>
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
