interface LogoProps {
  variant?: 'full' | 'compact'
}

export const Logo = ({ variant = 'full' }: LogoProps) => {
  return (
    <div className="flex items-center gap-2 select-none">
      <span
        className={`font-display bg-accent text-accent-ink tracking-[.02em] -rotate-3 [box-shadow:3px_3px_0_rgba(0,0,0,.6)] rounded px-3 py-[6px] ${variant === 'compact' ? 'text-sm' : 'text-[17px]'}`}
      >
        BACKSPIN!
      </span>
      {variant === 'full' && (
        <span className="hidden sm:inline font-display text-xs tracking-[.08em] text-cream">
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
