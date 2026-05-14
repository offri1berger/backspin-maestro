interface LogoProps {
  variant?: 'full' | 'compact'
}

export const Logo = ({ variant = 'full' }: LogoProps) => {
  return (
    <div className="flex items-center gap-2 select-none">
      <span
        className="font-display"
        style={{
          padding: '6px 12px',
          background: 'var(--color-accent)',
          color: 'var(--color-accent-ink)',
          fontSize: variant === 'compact' ? 14 : 17,
          letterSpacing: '.02em',
          transform: 'rotate(-3deg)',
          boxShadow: '3px 3px 0 rgba(0,0,0,.6)',
          borderRadius: 4,
        }}
      >
        BACKSPIN!
      </span>
      {variant === 'full' && (
        <span
          className="hidden sm:inline font-display"
          style={{ fontSize: 12, letterSpacing: '.08em', color: 'var(--color-cream)' }}
        >
          MAESTRO 808
        </span>
      )}
    </div>
  )
}

export const ArrowIcon = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14">
      <path
        d="M3 7h8m-3-3 3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
