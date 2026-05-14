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
    `h-9 lg:h-10 rounded-[10px] font-mono text-[10px] tracking-[0.08em] font-semibold transition-colors duration-150 ${
      disabled ? 'cursor-default opacity-80' : 'cursor-pointer'
    } ${
      active ? 'bg-accent text-accent-ink border-none' : 'bg-transparent text-on-bg border border-line'
    }`

  return (
    <div>
      <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">Decade</label>
      <div className="grid grid-cols-4 lg:grid-cols-7 gap-1.5 mt-2">
        <button
          type="button"
          onClick={() => !disabled && onChange('all')}
          disabled={disabled}
          className={chip(isAll)}
        >
          All
        </button>
        {SPECIFIC_DECADES.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => handleChip(d.value)}
            disabled={disabled}
            className={chip(selected.has(d.value))}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  )
}
