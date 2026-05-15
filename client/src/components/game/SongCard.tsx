import { useDraggable } from '@dnd-kit/core'

interface MysteryCardFaceProps {
  fullWidth?: boolean
  hint?: string
}

export const MysteryCardFace = ({ fullWidth = false, hint }: MysteryCardFaceProps) => {
  if (fullWidth) {
    return (
      <div
        className="relative overflow-hidden select-none flex items-center gap-3 px-4 py-3 rounded-xl text-cream border-[3px] border-[#000] min-h-[68px] bg-[linear-gradient(180deg,#28282b,#1a1a1c)] [box-shadow:0_8px_22px_rgba(0,0,0,.5),0_0_22px_color-mix(in_srgb,var(--color-hot)_35%,transparent),inset_0_1px_0_rgba(255,255,255,.06)]"
      >
        <div
          className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(135deg,transparent_0_18px,rgba(255,43,142,0.04)_18px_36px)]"
        />
        <div className="relative">
          <div
            className="font-display text-[10px] tracking-[0.1em] text-hot"
          >
            ● MYSTERY HIT
          </div>
          <div
            className="font-display text-lg leading-[1.1] mt-1 text-cream"
          >
            {hint ? hint : 'DRAG ONTO SHELF'}
          </div>
        </div>
        <div
          className="ml-auto font-display text-[48px] leading-none text-accent [text-shadow:3px_3px_0_var(--color-hot),6px_6px_0_var(--color-accent-ink)]"
        >
          ?
        </div>
      </div>
    )
  }

  // Small card — used in desktop HSlot, DragOverlay, spectator preview
  return (
    <div
      className="shrink-0 select-none w-[90px] rounded-[6px] border-[3px] border-[#000] p-[5px] bg-[linear-gradient(180deg,var(--color-hot),color-mix(in_srgb,var(--color-hot)_60%,#000))] [box-shadow:0_4px_10px_rgba(0,0,0,.5),0_0_18px_color-mix(in_srgb,var(--color-hot)_40%,transparent)]"
    >
      <div
        className="flex items-center justify-center h-10 bg-cream rounded-[2px] font-display text-[22px] text-accent-ink leading-none"
      >
        ?
      </div>
      <div
        className="mt-1 font-display text-center text-[9px] text-white tracking-[.05em]"
      >
        MYSTERY
      </div>
    </div>
  )
}

interface Props {
  draggable: boolean
  isWaiting: boolean
  fullWidth?: boolean
  hint?: string
}

const SongCard = ({ draggable, isWaiting, fullWidth = false, hint }: Props) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: 'current-song',
    disabled: !draggable || isWaiting,
    attributes: {
      roleDescription: 'Mystery song card. Press space or enter to pick up, arrow keys to move between slots, space or enter to drop, escape to cancel.',
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={[
        isDragging ? 'opacity-30' : 'opacity-100',
        draggable ? 'cursor-grab' : 'cursor-default',
        fullWidth ? 'w-full' : '',
        draggable ? 'touch-none' : '',
        '[-webkit-touch-callout:none] select-none transition-transform duration-[120ms] ease-[ease]',
        draggable && !isDragging ? 'active:scale-[0.97]' : '',
      ].filter(Boolean).join(' ')}
      {...(draggable ? { ...listeners, ...attributes } : {})}
    >
      <MysteryCardFace fullWidth={fullWidth} hint={hint} />
    </div>
  )
}

export default SongCard
