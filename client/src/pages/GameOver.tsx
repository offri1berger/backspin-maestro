import { useGameStore } from '../store/gameStore'

function Logo() {
  return (
    <div className="flex items-center gap-2 font-display text-[20px] text-on-bg">
      <div className="vinyl" style={{ width: 22, height: 22 }} />
      <span>Hitster</span>
    </div>
  )
}

const GameOverPage = () => {
  const { players, winnerId, playerId } = useGameStore()
  const ranked = [...players].sort((a, b) => b.timeline.length - a.timeline.length)
  const winner = ranked[0]
  const isWinner = winnerId === playerId

  return (
    <div className="min-h-screen bg-bg grid" style={{ gridTemplateColumns: '1.1fr 1fr' }}>

      {/* ── LEFT: Winner hero ── */}
      <div className="px-16 py-14 flex flex-col relative overflow-hidden">
        {/* Stacked vinyl records (decorative) */}
        <div style={{ position: 'absolute', right: -100, bottom: -80, width: 440, height: 440 }}>
          <div className="vinyl" style={{ position: 'absolute', left: 80, top: 60, width: 300, height: 300, transform: 'rotate(-12deg)', opacity: 0.45 }} />
          <div className="vinyl" style={{ position: 'absolute', left: 30, top: 30, width: 340, height: 340, transform: 'rotate(6deg)', opacity: 0.75 }} />
          <div className="vinyl vinyl-spin" style={{ position: 'absolute', left: 0, top: 0, width: 380, height: 380 }} />
        </div>

        <div className="relative flex justify-between items-center">
          <Logo />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">
            Side B · Final cut
          </span>
        </div>

        <div className="relative flex-1 flex flex-col justify-center">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-accent">
            {isWinner ? 'You won! 🎉' : "Tonight's winner"}
          </div>
          <h1 className="font-display mt-3.5 mb-0 tracking-[-0.02em] text-on-bg" style={{ fontSize: 100, lineHeight: 0.9 }}>
            {winner?.name}<br />
            <em className="italic text-accent" style={{ fontSize: 72 }}>tops the charts.</em>
          </h1>
          <p className="mt-6 text-muted text-base max-w-[420px] leading-[1.55]">
            {winner?.timeline.length} correct placements · {winner?.tokens} bonus stars.
            {isWinner ? ' Well played!' : ' Better luck next time.'}
          </p>
        </div>
      </div>

      {/* ── RIGHT: Leaderboard ── */}
      <div className="px-12 py-14 bg-bg-2 border-l border-line flex flex-col">
        {/* Section mark */}
        <div className="flex items-center gap-2 mb-[18px]">
          <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">Final tally</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {ranked.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl"
              style={{
                border: i === 0 ? '1.5px solid var(--color-accent)' : '1px solid var(--color-line)',
                background: i === 0 ? 'color-mix(in oklch, var(--color-accent) 8%, transparent)' : 'transparent',
              }}
            >
              {/* Rank */}
              <span className={`font-display text-[36px] w-10 leading-none flex-shrink-0 ${i === 0 ? 'text-accent' : 'text-muted'}`}>
                {i + 1}
              </span>

              {/* Avatar */}
              {p.avatar
                ? (
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                )
                : (
                  <div className="w-10 h-10 rounded-full bg-line flex items-center justify-center font-display text-[20px] text-on-bg flex-shrink-0">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                )
              }

              {/* Name + score */}
              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold text-on-bg">{p.name}</div>
                <div className="font-mono text-[10px] tracking-[0.1em] text-muted mt-0.5">
                  {p.timeline.length} cards · {p.tokens}★
                </div>
              </div>

              {/* Mini progress bar */}
              <div className="flex gap-[3px] flex-shrink-0">
                {Array.from({ length: 10 }).map((_, j) => (
                  <div
                    key={j}
                    className={`w-[7px] h-[22px] rounded-[2px] ${j < p.timeline.length ? 'bg-accent' : 'bg-line'}`}
                    style={{ opacity: j < p.timeline.length ? (i === 0 ? 1 : 0.55) : 1 }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex gap-3 mt-8">
          <button
            onClick={() => window.location.reload()}
            className="flex-[2] h-14 rounded-full bg-accent text-accent-ink border-none cursor-pointer font-body font-semibold text-base"
          >
            Rematch
          </button>
          <button
            className="flex-1 h-14 rounded-full bg-transparent text-on-bg border border-line cursor-pointer font-body font-semibold text-base"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameOverPage
