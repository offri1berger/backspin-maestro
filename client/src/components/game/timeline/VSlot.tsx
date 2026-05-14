import { useDroppable } from '@dnd-kit/core'

interface VSlotProps {
  id: number
  label: string
  ariaLabel?: string
  armed?: boolean
}

const VSlot = ({ id, label, ariaLabel, armed = false }: VSlotProps) => {
  const { isOver, setNodeRef } = useDroppable({ id })

  const base =
    'w-full flex items-center justify-center rounded-[8px] border-2 transition-all duration-150 font-display text-[11px] tracking-[0.05em] uppercase select-none'

  const styles =
    isOver
      ? {
          height: 56,
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--color-good) 30%, transparent), transparent)',
          borderColor: 'var(--color-good)',
          color: 'var(--color-good)',
          boxShadow: '0 0 20px color-mix(in srgb, var(--color-good) 55%, transparent), inset 0 0 0 1px rgba(0,0,0,.3)',
        }
      : armed
        ? {
            height: 44,
            background: 'transparent',
            borderColor: 'var(--color-accent)',
            borderStyle: 'dashed' as const,
            color: 'var(--color-accent)',
          }
        : {
            height: 44,
            background: 'transparent',
            borderColor: 'var(--color-muted-2)',
            borderStyle: 'dashed' as const,
            color: 'var(--color-muted)',
          }

  return (
    <div
      ref={setNodeRef}
      role="region"
      aria-label={ariaLabel ?? `Timeline slot ${id + 1} (${label})`}
      className={base}
      style={styles}
    >
      {isOver ? `▼ DROP IT! ▼` : `· ${label} ·`}
    </div>
  )
}

export default VSlot
