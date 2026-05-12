import { useDroppable } from '@dnd-kit/core'

interface VSlotProps {
  id: number
  label: string
  ariaLabel?: string
}

const VSlot = ({ id, label, ariaLabel }: VSlotProps) => {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      role="region"
      aria-label={ariaLabel ?? `Timeline slot ${id + 1} (${label})`}
      className={`w-full flex items-center justify-center rounded-[10px] border-2 transition-all duration-150 font-mono text-[10px] tracking-[0.15em] uppercase ${
        isOver ? 'border-accent text-accent border-solid h-12 font-bold' : 'border-line border-dashed text-muted-2 h-9'
      }`}
      style={isOver
        ? { background: 'color-mix(in oklch, var(--color-accent) 18%, transparent)', boxShadow: '0 0 16px color-mix(in oklch, var(--color-accent) 35%, transparent)' }
        : undefined}
    >
      {label}
    </div>
  )
}

export default VSlot
