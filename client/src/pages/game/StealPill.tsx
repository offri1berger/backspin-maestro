interface Props {
  stealerName: string | null
  countdown: number
}

const StealPill = ({ stealerName, countdown }: Props) => {
  const isDanger = countdown <= 3
  const borderColor = isDanger ? 'var(--color-bad)' : stealerName ? 'var(--color-hot)' : 'var(--color-muted-2)'
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2.5 rounded-[14px] bg-[linear-gradient(180deg,var(--color-accent),color-mix(in_srgb,var(--color-accent)_80%,#000))] border-[3px] border-[#000] text-accent-ink ${isDanger ? '[box-shadow:0_6px_0_#000,_0_0_24px_color-mix(in_srgb,var(--color-bad)_60%,transparent)] [animation:steal-pill-pulse_0.9s_infinite]' : '[box-shadow:0_6px_0_#000,_0_12px_30px_rgba(0,0,0,.5)]'}`}
    >
      <div
        className={`font-mono flex items-center justify-center w-10 h-10 rounded-full bg-[#0a0a0a] text-[22px] [text-shadow:0_0_8px_currentColor] [box-shadow:inset_0_2px_4px_rgba(0,0,0,.8)] ${isDanger ? 'text-bad' : 'text-good'}`}
      >
        {countdown}
      </div>
      <div>
        <div className="font-display text-[13px] tracking-[.05em]">
          {stealerName ? `⚡ ${stealerName.toUpperCase()} STEALING` : 'STEAL WINDOW!'}
        </div>
        <div className="font-display text-[10px] opacity-70 tracking-[.1em]">
          SPEND 1 ★ TO ATTEMPT
        </div>
      </div>
      <style>{`
        @keyframes steal-pill-pulse {
          0%,100% { transform: translate(-50%, 0) scale(1); }
          50%     { transform: translate(-50%, 0) scale(1.05); }
        }
      `}</style>
      <span className="hidden" style={{ color: borderColor }} />
    </div>
  )
}

export default StealPill
