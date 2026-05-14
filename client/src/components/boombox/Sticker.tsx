import type { CSSProperties, ReactNode } from 'react'

type StickerColor = 'yellow' | 'hot' | 'cyan' | 'green' | 'red' | 'orange' | 'cream'

const COLOR_TO_VAR: Record<StickerColor, string> = {
  yellow: 'var(--color-accent)',
  hot:    'var(--color-hot)',
  cyan:   'var(--color-cyan)',
  green:  'var(--color-good)',
  red:    'var(--color-bad)',
  orange: 'var(--color-orange)',
  cream:  'var(--color-cream)',
}

interface Props {
  color?: StickerColor
  rotate?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
  style?: CSSProperties
  children: ReactNode
}

export const Sticker = ({ color = 'yellow', rotate = -4, size = 'md', className = '', style, children }: Props) => {
  const sizeStyle: CSSProperties =
    size === 'sm' ? { fontSize: 10, padding: '3px 8px' }
    : size === 'lg' ? { fontSize: 16, padding: '8px 16px' }
    : { fontSize: 13, padding: '6px 14px' }

  const fg = color === 'yellow' || color === 'cyan' || color === 'cream' || color === 'green'
    ? 'var(--color-accent-ink)'
    : '#fff'

  return (
    <span
      className={`sticker ${className}`}
      style={{
        background: COLOR_TO_VAR[color],
        color: fg,
        transform: `rotate(${rotate}deg)`,
        ...sizeStyle,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

export default Sticker
