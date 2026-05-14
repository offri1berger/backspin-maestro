import type { CSSProperties, ReactNode } from 'react'

type LedColor = 'yellow' | 'hot' | 'cyan' | 'green' | 'red' | 'muted'

const COLOR_CLASS: Record<LedColor, string> = {
  yellow: 'led-yellow',
  hot:    'led-hot',
  cyan:   'led-cyan',
  green:  'led-green',
  red:    'led-red',
  muted:  '',
}

interface Props {
  color?: LedColor
  className?: string
  style?: CSSProperties
  children: ReactNode
}

export const LedDisplay = ({ color = 'green', className = '', style, children }: Props) => (
  <div className={`led ${COLOR_CLASS[color]} ${className}`} style={style}>
    {children}
  </div>
)

export default LedDisplay
