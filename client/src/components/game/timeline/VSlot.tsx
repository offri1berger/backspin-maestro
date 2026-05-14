import { useDroppable } from '@dnd-kit/core'

interface VSlotProps {
  id: number
  label: string
  ariaLabel?: string
  armed?: boolean
}

const VSlot = ({ id, label, ariaLabel, armed = false }: VSlotProps) => {
  const { isOver, setNodeRef } = useDroppable({ id })

  const base = 'w-full flex items-center justify-center rounded-[10px] border-2 transition-all duration-150 font-mono text-[10px] tracking-[0.15em] uppercase select-none'
  const stateClasses = isOver
    ? 'border-accent text-accent border-solid h-14 font-bold'
    : armed
      ? 'border-accent/60 text-accent/80 border-dashed h-11'
      : 'border-line border-dashed text-muted-2 h-11'

  return (
    <div
      ref={setNodeRef}
      role="region"
      aria-label={ariaLabel ?? `Timeline slot ${id + 1} (${label})`}
      className={`${base} ${stateClasses}`}
      style={
        isOver
          ? {
              background: 'color-mix(in oklch, var(--color-accent) 22%, transparent)',
              boxShadow: '0 0 24px color-mix(in oklch, var(--color-accent) 45%, transparent)',
            }
          : armed
            ? { background: 'color-mix(in oklch, var(--color-accent) 6%, transparent)' }
            : undefined
      }
    >
      {label}
    </div>
  )
}

export default VSlot
