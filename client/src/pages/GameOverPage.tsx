import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { MiniYearCard } from '../components/game/Timeline'
import { Logo } from '../components/ui/Logo'
import socket from '../socket'

const GameOverPage = () => {
  const navigate = useNavigate()
  const { players, winnerId, playerId, settings } = useGameStore()
  const songsToWin = settings?.songsPerPlayer ?? 10
  const ranked = [...players].sort((a, b) => b.timeline.length - a.timeline.length)
  const winner = ranked[0]
  const isWinner = winnerId === playerId
  const isHost = players.find((p) => p.id === playerId)?.isHost ?? false

  const handleRematch = () => {
    if (!window.confirm('Start a rematch with the same players and settings?')) return
    socket.emit('room:reset', (result) => {
      if ('error' in result) console.error('rematch error:', result.error)
    })
  }

  return (
    <div className="min-h-screen bg-bg grid grid-cols-[1.1fr_1fr]">

      {/* ── LEFT: Winner hero ── */}
      <div className="px-16 py-14 flex flex-col relative overflow-hidden">
        {/* Stacked vinyl records (decorative) */}
        <div className="absolute -right-[100px] -bottom-[80px] w-[440px] h-[440px]">
          <div className="vinyl absolute left-[80px] top-[60px] w-[300px] h-[300px] -rotate-12 opacity-45" />
          <div className="vinyl absolute left-[30px] top-[30px] w-[340px] h-[340px] rotate-6 opacity-75" />
          <div className="vinyl vinyl-spin absolute left-0 top-0 w-[380px] h-[380px]" />
        </div>

        <div className="relative flex justify-between items-center">
          <Logo />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">
            Side B · Final cut
          </span>
        </div>

        <div className="relative flex-1 flex flex-col justify-center">
          <div
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-accent winner-fade"
            style={{ animationDelay: '120ms' }}
          >
            {isWinner ? 'You won! 🎉' : "Tonight's winner"}
          </div>
          <h1
            className="font-display text-[100px] leading-[0.9] mt-3.5 mb-0 tracking-[-0.02em] text-on-bg winner-rise"
            style={{ animationDelay: '260ms' }}
          >
            {winner?.name}<br />
            <em className="italic text-accent text-[72px]">tops the charts.</em>
          </h1>
          <p
            className="mt-6 text-muted text-base max-w-[420px] leading-[1.55] winner-fade"
            style={{ animationDelay: '760ms' }}
          >
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
              className={`flex flex-col rounded-2xl overflow-hidden transition-colors ${
                i === 0
                  ? 'border-[1.5px] border-accent bg-accent/8 hover:bg-accent/12'
                  : 'border border-line hover:bg-on-bg/4'
              }`}
            >
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Rank */}
                <span className={`font-display text-[36px] w-10 leading-none shrink-0 ${i === 0 ? 'text-accent' : 'text-muted'}`}>
                  {i + 1}
                </span>

                {/* Avatar */}
                {p.avatar
                  ? (
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  )
                  : (
                    <div className="w-10 h-10 rounded-full bg-line flex items-center justify-center font-display text-[20px] text-on-bg shrink-0">
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
                <div className="flex gap-[3px] shrink-0">
                  {Array.from({ length: songsToWin }).map((_, j) => (
                    <div
                      key={j}
                      className={`w-[7px] h-[22px] rounded-[2px] ${j < p.timeline.length ? 'bg-accent' : 'bg-line'}`}
                      style={{ opacity: j < p.timeline.length ? (i === 0 ? 1 : 0.55) : 1 }}
                    />
                  ))}
                </div>
              </div>

              {/* Timeline cards */}
              {p.timeline.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto px-5 pb-4">
                  {p.timeline.map((entry, j) => (
                    <MiniYearCard key={j} entry={entry} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex gap-3 mt-8">
          {isHost ? (
            <button
              onClick={handleRematch}
              className="flex-[2] h-14 rounded-full bg-accent text-accent-ink border-none cursor-pointer font-body font-semibold text-base"
            >
              Rematch
            </button>
          ) : (
            <div className="flex-[2] h-14 rounded-full border border-line flex items-center justify-center font-mono text-[10px] tracking-[0.15em] uppercase text-muted">
              Waiting for the conductor…
            </div>
          )}
          <button
            onClick={() => navigate('/')}
            className="flex-1 h-14 rounded-full bg-transparent text-on-bg border border-line cursor-pointer font-body font-semibold text-base"
          >
            Back to game
          </button>
          <button
          disabled
            className="flex-1 h-14 rounded-full bg-transparent text-on-bg border border-line font-body font-semibold text-base cursor-not-allowed"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameOverPage
