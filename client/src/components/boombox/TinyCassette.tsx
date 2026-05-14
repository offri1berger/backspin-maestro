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
      className={className}
      style={{
        width,
        height: width * 0.62,
        position: 'relative',
        background: `linear-gradient(180deg, ${c}, color-mix(in srgb, ${c} 70%, #000))`,
        borderRadius: 4,
        boxShadow: 'inset 0 0 0 2px rgba(0,0,0,.25), 0 2px 4px rgba(0,0,0,.4)',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute', left: '8%', right: '8%', top: '12%', height: '40%',
          background: 'var(--color-cream)',
          borderRadius: 1,
        }}
      />
      <div
        style={{
          position: 'absolute', left: '15%', bottom: '15%', width: width * 0.18, height: width * 0.18,
          borderRadius: '50%', background: '#000',
          boxShadow: `inset 0 0 0 ${Math.max(2, width * 0.045)}px ${c}`,
        }}
      />
      <div
        style={{
          position: 'absolute', right: '15%', bottom: '15%', width: width * 0.18, height: width * 0.18,
          borderRadius: '50%', background: '#000',
          boxShadow: `inset 0 0 0 ${Math.max(2, width * 0.045)}px ${c}`,
        }}
      />
    </div>
  )
}

export default TinyCassette
