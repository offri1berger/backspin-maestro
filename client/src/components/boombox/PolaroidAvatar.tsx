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
      className={className}
      style={{
        transform: `rotate(${rotate}deg)`,
        display: 'inline-block',
        ...style,
      }}
    >
      <div
        className={`polaroid ${active ? 'polaroid-active' : ''}`}
        style={{ width: cardWidth, padding: name ? '7px 7px 22px' : '7px 7px 7px' }}
      >
        <div
          style={{
            width: size, height: size,
            background: src ? `url(${src}) center/cover` : 'linear-gradient(135deg, #d8cda6, #b9ad88)',
            filter: 'brightness(1.08) saturate(1.15) contrast(1.05)',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: size * 0.4, color: 'var(--color-accent-ink)',
            overflow: 'hidden',
          }}
        >
          {!src && fallback.toUpperCase()}
        </div>
        {name && (
          <div
            style={{
              marginTop: 6,
              fontFamily: 'var(--font-marker)',
              fontSize: Math.max(9, Math.round(size * 0.16)),
              color: 'var(--color-accent-ink)',
              textAlign: 'center', lineHeight: 1, letterSpacing: '.02em',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
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
