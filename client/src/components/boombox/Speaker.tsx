import type { CSSProperties } from 'react'

type SpeakerColor = 'hot' | 'cyan' | 'yellow'

const COLOR_TO_VAR: Record<SpeakerColor, string> = {
  hot:    'var(--color-hot)',
  cyan:   'var(--color-cyan)',
  yellow: 'var(--color-accent)',
}

interface Props {
  size?: number
  color?: SpeakerColor
  pulse?: boolean
  className?: string
  style?: CSSProperties
}

export const Speaker = ({ size = 120, color = 'hot', pulse = true, className = '', style }: Props) => {
  const c = COLOR_TO_VAR[color]
  return (
    <div
      className={className}
      style={{
        width: size, height: size,
        borderRadius: '50%',
        position: 'relative',
        background: `radial-gradient(circle at 35% 30%, #5a5a60, #3a3a3e 30%, #2a2a2c 80%)`,
        boxShadow: 'inset 0 -8px 16px rgba(0,0,0,.5), inset 0 4px 8px rgba(255,255,255,.05), 0 8px 20px rgba(0,0,0,.5)',
        animation: pulse ? 'speaker-pulse 0.6s ease-in-out infinite' : undefined,
        ...style,
      }}
    >
      {[0.85, 0.65, 0.42, 0.22].map((r, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', inset: `${(1 - r) * 50}%`, borderRadius: '50%',
            border: i === 3 ? 0 : '1px solid rgba(0,0,0,.5)',
            background: i === 3 ? `radial-gradient(circle, ${c}, color-mix(in srgb, ${c} 60%, #000))` : 'transparent',
            boxShadow: i === 3
              ? `inset 0 -4px 8px rgba(0,0,0,.4), 0 0 14px color-mix(in srgb, ${c} 50%, transparent)`
              : 'inset 0 1px 2px rgba(255,255,255,.05)',
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute', inset: '46%', borderRadius: '50%',
          background: '#0a0a0a',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.15)',
        }}
      />
      <style>{`@keyframes speaker-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }`}</style>
    </div>
  )
}

export default Speaker
