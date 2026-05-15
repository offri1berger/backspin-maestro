import type { CSSProperties } from 'react'

interface Props {
  src?: string
  fallback?: string
  size?: number
  rotate?: number
  active?: boolean
  name?: string
  className?: string
  style?: CSSProperties
}

export const PolaroidAvatar = ({
  src, fallback = '?', size = 64, rotate = -4,
  active = false, name, className = '', style,
}: Props) => {
  const cardWidth = size + 14
  return (
    <div
      className={`inline-block ${className}`}
      style={{
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
    >
      <div
        className={`polaroid ${active ? 'polaroid-active' : ''}`}
        style={{ width: cardWidth, padding: name ? '7px 7px 22px' : '7px 7px 7px' }}
      >
        <div
          className="flex items-center justify-center font-display text-accent-ink overflow-hidden [filter:brightness(1.08)_saturate(1.15)_contrast(1.05)] [box-shadow:inset_0_0_0_1px_rgba(0,0,0,.15)]"
          style={{
            width: size, height: size,
            background: src ? `url(${src}) center/cover` : 'linear-gradient(135deg, #d8cda6, #b9ad88)',
            fontSize: size * 0.4,
          }}
        >
          {!src && fallback.toUpperCase()}
        </div>
        {name && (
          <div
            className="font-marker text-accent-ink text-center leading-none tracking-[.02em] whitespace-nowrap overflow-hidden text-ellipsis mt-[6px]"
            style={{
              fontSize: Math.max(9, Math.round(size * 0.16)),
            }}
          >
            {name}
          </div>
        )}
      </div>
    </div>
  )
}

export default PolaroidAvatar
