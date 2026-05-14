import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

type ButtonColor = 'yellow' | 'pink' | 'green' | 'dark'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ButtonColor
  children: ReactNode
}

const COLOR_CLASS: Record<ButtonColor, string> = {
  yellow: 'plastic-btn',
  pink:   'plastic-btn plastic-btn-pink',
  green:  'plastic-btn plastic-btn-green',
  dark:   'plastic-btn plastic-btn-dark',
}

export const PlasticButton = ({ color = 'yellow', className = '', children, style, ...rest }: Props) => {
  const base = COLOR_CLASS[color]
  const merged: CSSProperties = { ...style }
  return (
    <button className={`${base} ${className}`} style={merged} {...rest}>
      {children}
    </button>
  )
}

export default PlasticButton
