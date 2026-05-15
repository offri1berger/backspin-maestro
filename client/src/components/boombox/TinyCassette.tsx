import type { CSSProperties } from 'react'

type CassetteColor = 'yellow' | 'hot' | 'cyan' | 'orange' | 'green' | 'red'

const COLOR_TO_VAR: Record<CassetteColor, string> = {
  yellow: 'var(--color-accent)',
  hot:    'var(--color-hot)',
  cyan:   'var(--color-cyan)',
  orange: 'var(--color-orange)',
  green:  'var(--color-good)',
  red:    'var(--color-bad)',
}

interface Props {
  color?: CassetteColor
  width?: number
  className?: string
  style?: CSSProperties
}

export const TinyCassette = ({ color = 'yellow', width = 64, className = '', style }: Props) => {
  const c = COLOR_TO_VAR[color]
  return (
    <div
      className={`relative rounded [box-shadow:inset_0_0_0_2px_rgba(0,0,0,.25),0_2px_4px_rgba(0,0,0,.4)] ${className}`}
      style={{
        width,
        height: width * 0.62,
        background: `linear-gradient(180deg, ${c}, color-mix(in srgb, ${c} 70%, #000))`,
        ...style,
      }}
    >
      <div
        className="absolute left-[8%] right-[8%] top-[12%] h-[40%] bg-cream rounded-sm"
      />
      <div
        className="absolute left-[15%] bottom-[15%] rounded-full bg-black"
        style={{
          width: width * 0.18, height: width * 0.18,
          boxShadow: `inset 0 0 0 ${Math.max(2, width * 0.045)}px ${c}`,
        }}
      />
      <div
        className="absolute right-[15%] bottom-[15%] rounded-full bg-black"
        style={{
          width: width * 0.18, height: width * 0.18,
          boxShadow: `inset 0 0 0 ${Math.max(2, width * 0.045)}px ${c}`,
        }}
      />
    </div>
  )
}

export default TinyCassette
