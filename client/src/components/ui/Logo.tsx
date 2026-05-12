export const Logo = () => {
  return (
    <div className="flex items-center gap-2 font-display text-[22px] tracking-[-0.01em] text-on-bg">
      <div className="vinyl w-7 h-7" />
      <span>Backspin Maestro</span>
    </div>
  )
}

export const ArrowIcon = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14">
      <path
        d="M3 7h8m-3-3 3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
