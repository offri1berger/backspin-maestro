interface Props {
  stealerName: string | null
  countdown: number
}

const StealPill = ({ stealerName, countdown }: Props) => {
  const isDanger = countdown <= 3
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-2.5 rounded-full bg-surface border shadow-[0_8px_24px_rgba(0,0,0,0.2)] ${isDanger ? 'border-bad' : stealerName ? 'border-accent' : 'border-line'}`}
      style={{
        animation: isDanger ? 'steal-pill-pulse 0.9s infinite' : 'none',
        boxShadow: isDanger ? '0 0 24px rgba(255,80,80,0.35)' : '0 8px 24px rgba(0,0,0,0.2)',
      }}
    >
      {stealerName ? (
        <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-accent">
          ⚡ {stealerName} is stealing…
        </span>
      ) : (
        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">
          steal window
        </span>
      )}
      <span className={`font-display text-[28px] leading-none ${isDanger ? 'text-bad' : 'text-accent'}`}>
        {countdown}
      </span>
      <style>{`@keyframes steal-pill-pulse { 0%,100% { transform: translate(-50%, 0) scale(1); } 50% { transform: translate(-50%, 0) scale(1.05); } }`}</style>
    </div>
  )
}

export default StealPill
