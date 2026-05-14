interface Props {
  stealerName: string | null
  countdown: number
}

const StealPill = ({ stealerName, countdown }: Props) => {
  const isDanger = countdown <= 3
  const borderColor = isDanger ? 'var(--color-bad)' : stealerName ? 'var(--color-hot)' : 'var(--color-muted-2)'
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2.5 rounded-[14px]"
      style={{
        background: `linear-gradient(180deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 80%, #000))`,
        border: '3px solid #000',
        color: 'var(--color-accent-ink)',
        boxShadow: isDanger
          ? '0 6px 0 #000, 0 0 24px color-mix(in srgb, var(--color-bad) 60%, transparent)'
          : '0 6px 0 #000, 0 12px 30px rgba(0,0,0,.5)',
        animation: isDanger ? 'steal-pill-pulse 0.9s infinite' : 'none',
      }}
    >
      <div
        className="font-mono flex items-center justify-center"
        style={{
          width: 40, height: 40, borderRadius: '50%',
          background: '#0a0a0a',
          color: isDanger ? 'var(--color-bad)' : 'var(--color-good)',
          fontSize: 22,
          textShadow: `0 0 8px currentColor`,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,.8)',
        }}
      >
        {countdown}
      </div>
      <div>
        <div
          className="font-display"
          style={{ fontSize: 13, letterSpacing: '.05em' }}
        >
          {stealerName ? `⚡ ${stealerName.toUpperCase()} STEALING` : 'STEAL WINDOW!'}
        </div>
        <div className="font-display" style={{ fontSize: 10, opacity: .7, letterSpacing: '.1em' }}>
          SPEND 1 ★ TO ATTEMPT
        </div>
      </div>
      <style>{`
        @keyframes steal-pill-pulse {
          0%,100% { transform: translate(-50%, 0) scale(1); }
          50%     { transform: translate(-50%, 0) scale(1.05); }
        }
      `}</style>
      <span style={{ display: 'none', color: borderColor }} />
    </div>
  )
}

export default StealPill
