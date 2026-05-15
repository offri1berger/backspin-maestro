import type { DecadeFilter, SpecificDecade } from '@backspin-maestro/shared'
import { SPECIFIC_DECADES_ORDER } from '@backspin-maestro/shared'

const SPECIFIC_DECADES: { label: string; value: SpecificDecade }[] = [
  { label: '60s', value: '60s' },
  { label: '70s', value: '70s' },
  { label: '80s', value: '80s' },
  { label: '90s', value: '90s' },
  { label: '00s', value: '00s' },
  { label: '10s', value: '10s' },
]

const toggleAndFill = (current: SpecificDecade[], clicked: SpecificDecade): SpecificDecade[] => {
  const set = new Set(current)
  if (set.has(clicked)) set.delete(clicked)
  else set.add(clicked)
  if (set.size === 0) return current
  const indices = [...set].map((d) => SPECIFIC_DECADES_ORDER.indexOf(d))
  const min = Math.min(...indices)
  const max = Math.max(...indices)
  return SPECIFIC_DECADES_ORDER.slice(min, max + 1)
}

interface Props {
  decadeFilter: DecadeFilter
  onChange: (d: DecadeFilter) => void
  disabled?: boolean
}

export const DecadePicker = ({ decadeFilter, onChange, disabled = false }: Props) => {
  const isAll = decadeFilter === 'all'
  const selected = isAll ? new Set<SpecificDecade>() : new Set(decadeFilter)

  const handleChip = (d: SpecificDecade) => {
    if (disabled) return
    if (isAll) {
      onChange([d])
      return
    }
    onChange(toggleAndFill(decadeFilter, d))
  }

  const chip = (active: boolean) =>
    [
      'h-9 rounded-[6px] font-display text-[11px] tracking-[0.05em] transition-all duration-150',
      'border-2 border-[#0a0a0a]',
      disabled ? 'cursor-default opacity-80' : 'cursor-pointer',
      active
        ? 'text-[var(--color-accent-ink)]'
        : 'text-[var(--color-cream)] bg-[#0a0a0a]',
    ].join(' ')

  return (
    <div>
      <div className="font-display text-[10px] tracking-[0.1em] uppercase mb-2 text-cyan">
        DECADE
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
        <button
          type="button"
          onClick={() => !disabled && onChange('all')}
          disabled={disabled}
          className={`${chip(isAll)} ${isAll
            ? 'bg-[linear-gradient(180deg,var(--color-hot),color-mix(in_srgb,var(--color-hot)_70%,#000))] text-white [box-shadow:0_2px_0_#000,0_0_10px_color-mix(in_srgb,var(--color-hot)_50%,transparent)]'
            : '[box-shadow:inset_0_2px_4px_rgba(0,0,0,.6)]'}`}
        >
          ALL
        </button>
        {SPECIFIC_DECADES.map((d) => {
          const active = selected.has(d.value)
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => handleChip(d.value)}
              disabled={disabled}
              className={`${chip(active)} ${active
                ? 'bg-[linear-gradient(180deg,var(--color-hot),color-mix(in_srgb,var(--color-hot)_70%,#000))] text-white [box-shadow:0_2px_0_#000,0_0_10px_color-mix(in_srgb,var(--color-hot)_50%,transparent)]'
                : '[box-shadow:inset_0_2px_4px_rgba(0,0,0,.6)]'}`}
            >
              {d.label.toUpperCase()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
