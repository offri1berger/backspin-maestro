interface Props {
  stealerName: string | null
  countdown: number
}

const StealPill = ({ stealerName, countdown }: Props) => (  
  <div
    className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-2.5 rounded-full bg-surface border shadow-[0_8px_24px_rgba(0,0,0,0.2)] ${stealerName ? 'border-accent' : 'border-line'}`}
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
    <span className={`font-display text-[28px] leading-none ${countdown <= 3 ? 'text-bad' : 'text-accent'}`}>
      {countdown}
    </span>
  </div>
)

export default StealPill
