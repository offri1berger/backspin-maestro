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
      className={`rounded-full relative bg-[radial-gradient(circle_at_35%_30%,#5a5a60,#3a3a3e_30%,#2a2a2c_80%)] [box-shadow:inset_0_-8px_16px_rgba(0,0,0,.5),inset_0_4px_8px_rgba(255,255,255,.05),0_8px_20px_rgba(0,0,0,.5)] ${className}`}
      style={{
        width: size, height: size,
        animation: pulse ? 'speaker-pulse 0.6s ease-in-out infinite' : undefined,
        ...style,
      }}
    >
      {[0.85, 0.65, 0.42, 0.22].map((r, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            inset: `${(1 - r) * 50}%`,
            border: i === 3 ? 0 : '1px solid rgba(0,0,0,.5)',
            background: i === 3 ? `radial-gradient(circle, ${c}, color-mix(in srgb, ${c} 60%, #000))` : 'transparent',
            boxShadow: i === 3
              ? `inset 0 -4px 8px rgba(0,0,0,.4), 0 0 14px color-mix(in srgb, ${c} 50%, transparent)`
              : 'inset 0 1px 2px rgba(255,255,255,.05)',
          }}
        />
      ))}
      <div
        className="absolute rounded-full bg-[#0a0a0a] [box-shadow:inset_0_0_0_1px_rgba(255,255,255,.15)] inset-[46%]"
      />
      <style>{`@keyframes speaker-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }`}</style>
    </div>
  )
}

export default Speaker
