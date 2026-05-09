import { useDroppable } from '@dnd-kit/core'

interface VSlotProps {
  id: number
  label: string
}

const VSlot = ({ id, label }: VSlotProps) => {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`w-full h-9 flex items-center justify-center rounded-[10px] border border-dashed transition-[border-color,background] duration-150 font-mono text-[10px] tracking-[0.15em] uppercase ${
        isOver ? 'border-accent text-accent' : 'border-line text-muted-2'
      }`}
      style={isOver ? { background: 'color-mix(in oklch, var(--color-accent) 14%, transparent)' } : undefined}
    >
      {label}
    </div>
  )
}

export default VSlot
