import { useGameStore } from '../store/gameStore'

const PLAYER_COLORS = ['#e8a598', '#98c5e8', '#98e8b4', '#e8d598', '#c598e8', '#e898c5']

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-display)', fontSize: 20 }}>
      <div className="vinyl" style={{ width: 22, height: 22 }} />
      <span style={{ color: 'var(--on-bg)' }}>Hitster</span>
    </div>
  )
}

const GameOverPage = () => {
  const { players, winnerId, playerId } = useGameStore()
  const ranked = [...players].sort((a, b) => b.timeline.length - a.timeline.length)
  const winner = ranked[0]
  const isWinner = winnerId === playerId

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'grid',
      gridTemplateColumns: '1.1fr 1fr',
    }}>

      {/* ── LEFT: Winner hero ── */}
      <div style={{
        padding: '56px 64px 48px',
        display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Stacked vinyl records (decorative) */}
        <div style={{ position: 'absolute', right: -100, bottom: -80, width: 440, height: 440 }}>
          <div className="vinyl" style={{ position: 'absolute', left: 80, top: 60, width: 300, height: 300, transform: 'rotate(-12deg)', opacity: 0.45 }} />
          <div className="vinyl" style={{ position: 'absolute', left: 30, top: 30, width: 340, height: 340, transform: 'rotate(6deg)', opacity: 0.75 }} />
          <div className="vinyl vinyl-spin" style={{ position: 'absolute', left: 0, top: 0, width: 380, height: 380 }} />
        </div>

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Side B · Final cut
          </span>
        </div>

        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)' }}>
            {isWinner ? 'You won! 🎉' : "Tonight's winner"}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 100, lineHeight: 0.9,
            margin: '14px 0 0',
            letterSpacing: '-0.02em',
            color: 'var(--on-bg)',
          }}>
            {winner?.name}<br />
            <em style={{ fontStyle: 'italic', color: 'var(--accent)', fontSize: 72 }}>tops the charts.</em>
          </h1>
          <p style={{ marginTop: 24, color: 'var(--muted)', fontSize: 16, maxWidth: 420, lineHeight: 1.55 }}>
            {winner?.timeline.length} correct placements · {winner?.tokens} bonus stars.
            {isWinner ? ' Well played!' : ' Better luck next time.'}
          </p>
        </div>
      </div>

      {/* ── RIGHT: Leaderboard ── */}
      <div style={{
        padding: '56px 48px 48px',
        background: 'var(--bg-2)',
        borderLeft: '1px solid var(--line)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Section mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>Final tally</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ranked.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '16px 20px',
              border: i === 0 ? '1.5px solid var(--accent)' : '1px solid var(--line)',
              borderRadius: 16,
              background: i === 0 ? 'color-mix(in oklch, var(--accent) 8%, transparent)' : 'transparent',
            }}>
              {/* Rank */}
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 36,
                width: 40, lineHeight: 1, flexShrink: 0,
                color: i === 0 ? 'var(--accent)' : 'var(--muted)',
              }}>{i + 1}</span>

              {/* Avatar */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: PLAYER_COLORS[players.indexOf(p) % PLAYER_COLORS.length],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: 20,
                color: '#1a1612', flexShrink: 0,
              }}>{p.name.charAt(0).toUpperCase()}</div>

              {/* Name + score */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--on-bg)' }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--muted)', marginTop: 2 }}>
                  {p.timeline.length} cards · {p.tokens}★
                </div>
              </div>

              {/* Mini progress bar */}
              <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                {Array.from({ length: 10 }).map((_, j) => (
                  <div key={j} style={{
                    width: 7, height: 22, borderRadius: 2,
                    background: j < p.timeline.length ? 'var(--accent)' : 'var(--line)',
                    opacity: j < p.timeline.length ? (i === 0 ? 1 : 0.55) : 1,
                  }} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              flex: 2, height: 56, borderRadius: 999,
              background: 'var(--accent)', color: 'var(--accent-ink)',
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16,
            }}
          >
            Rematch
          </button>
          <button
            style={{
              flex: 1, height: 56, borderRadius: 999,
              background: 'transparent', color: 'var(--on-bg)',
              border: '1px solid var(--line)', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16,
            }}
          >
            Share
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameOverPage
