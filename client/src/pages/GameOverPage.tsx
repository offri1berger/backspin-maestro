import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { MiniYearCard } from '../components/game/Timeline'
import { Logo } from '../components/ui/Logo'
import socket from '../socket'
import Sticker from '../components/boombox/Sticker'
import LedDisplay from '../components/boombox/LedDisplay'
import PolaroidAvatar from '../components/boombox/PolaroidAvatar'
import PlasticButton from '../components/boombox/PlasticButton'

const CONFETTI = [
  { c: 'var(--color-accent)', x: '6%',  y: '12%', r: -15, t: '★', size: 56 },
  { c: 'var(--color-cyan)',   x: '90%', y: '8%',  r: 12,  t: '♪', size: 64 },
  { c: 'var(--color-hot)',    x: '12%', y: '82%', r: 8,   t: '♬', size: 56 },
  { c: 'var(--color-good)',   x: '88%', y: '76%', r: -10, t: '★', size: 60 },
  { c: 'var(--color-orange)', x: '50%', y: '4%',  r: 4,   t: '+1', size: 36 },
]

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
    <div className="min-h-dvh boombox-bg-soft text-on-bg relative overflow-hidden">
      {/* Confetti stickers */}
      {CONFETTI.map((s, i) => (
        <div
          key={i}
          className="absolute pointer-events-none pop-in"
          style={{
            left: s.x, top: s.y,
            fontFamily: 'var(--font-display)', fontSize: s.size, color: s.c,
            transform: `rotate(${s.r}deg)`,
            textShadow: '4px 4px 0 var(--color-accent-ink)',
            animationDelay: `${i * 120}ms`,
          }}
        >
          {s.t}
        </div>
      ))}

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-5 lg:py-8 flex flex-col gap-5">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Logo />
          <span
            className="font-display"
            style={{ fontSize: 11, color: 'var(--color-muted)', letterSpacing: '.1em' }}
          >
            SET LIST FINI ◆ {useGameStore.getState().roomCode ?? '------'}
          </span>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-10 items-center">
          {/* Winner column */}
          <div className="text-center lg:text-left">
            <Sticker color="cyan" rotate={-6} size="lg">1ST PLACE</Sticker>
            <h1
              className="boombox-title boombox-title-yellow"
              style={{ fontSize: 'clamp(56px, 12vw, 132px)', margin: '14px 0 18px' }}
            >
              {winner?.name?.toUpperCase()}!
            </h1>

            <div className="inline-block relative">
              <PolaroidAvatar
                src={winner?.avatar}
                fallback={winner?.name?.charAt(0)}
                size={140}
                rotate={-4}
                active
                name={winner?.name?.toUpperCase()}
              />
              <Sticker
                color="yellow"
                rotate={15}
                size="md"
                style={{ position: 'absolute', top: -16, right: -22 }}
              >
                WINNER ★
              </Sticker>
              <Sticker
                color="hot"
                rotate={-12}
                size="sm"
                style={{ position: 'absolute', bottom: -4, left: -16 }}
              >
                {winner?.timeline.length}/{songsToWin}
              </Sticker>
            </div>

            <p
              className="mt-5 max-w-[480px] text-[14px] leading-[1.55] mx-auto lg:mx-0"
              style={{ color: 'var(--color-muted)' }}
            >
              {winner?.timeline.length} correct placements · {winner?.tokens} bonus ★ ·
              {isWinner ? ' Crushed it.' : ' Their shelf is the new gold standard.'}
            </p>
          </div>

          {/* Leaderboard */}
          <div className="brushed-darker panel-hardware p-4 lg:p-5">
            <Sticker color="hot" rotate={-4} size="sm" className="mb-4 block">CHART</Sticker>
            <div className="flex flex-col gap-3">
              {ranked.map((p, i) => {
                const filledPct = Math.min(1, p.timeline.length / songsToWin)
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 pb-3"
                    style={{ borderBottom: i < ranked.length - 1 ? '2px dashed rgba(255,255,255,.08)' : 'none' }}
                  >
                    <div
                      className="font-display flex items-center justify-center"
                      style={{
                        width: 38, height: 38, borderRadius: 6,
                        background: i === 0
                          ? 'linear-gradient(135deg, var(--color-accent), var(--color-orange))'
                          : '#2a2a2c',
                        color: i === 0 ? 'var(--color-accent-ink)' : 'var(--color-muted)',
                        fontSize: 16,
                        boxShadow: i === 0
                          ? '0 3px 0 color-mix(in srgb, var(--color-accent) 55%, #000)'
                          : '0 2px 0 #000',
                      }}
                    >
                      {i + 1}
                    </div>
                    <PolaroidAvatar
                      src={p.avatar}
                      fallback={p.name.charAt(0)}
                      size={40}
                      rotate={i % 2 ? -3 : 3}
                      active={i === 0}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-display"
                        style={{ fontSize: 14, color: 'var(--color-cream)' }}
                      >
                        {p.name}
                      </div>
                      <div
                        className="font-mono mt-0.5"
                        style={{ fontSize: 13, color: 'var(--color-muted)', letterSpacing: '.05em' }}
                      >
                        {p.timeline.length} CARDS · {p.tokens} ★
                      </div>
                      {/* mini progress */}
                      <div
                        className="mt-1 h-1 rounded relative overflow-hidden"
                        style={{ background: '#0a0a0a' }}
                      >
                        <div
                          className="absolute inset-0"
                          style={{
                            width: `${filledPct * 100}%`,
                            background: i === 0
                              ? 'linear-gradient(90deg, var(--color-accent), var(--color-hot))'
                              : 'var(--color-muted-2)',
                            boxShadow: i === 0 ? '0 0 6px var(--color-accent)' : 'none',
                          }}
                        />
                      </div>
                    </div>
                    <LedDisplay
                      color={i === 0 ? 'yellow' : 'muted'}
                      style={{ fontSize: 20, padding: '4px 10px', minWidth: 56, textAlign: 'center' }}
                    >
                      {String(p.timeline.length).padStart(2, '0')}
                    </LedDisplay>
                  </div>
                )
              })}
            </div>

            {ranked[0] && ranked[0].timeline.length > 0 && (
              <div className="mt-4">
                <Sticker color="yellow" rotate={-3} size="sm">WINNER'S SHELF</Sticker>
                <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {ranked[0].timeline.map((entry, j) => (
                    <MiniYearCard key={j} entry={entry} index={j} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          {isHost ? (
            <PlasticButton
              onClick={handleRematch}
              color="green"
              className="flex-1 h-[60px] text-[16px] flex items-center justify-center"
            >
              ▶ ENCORE · NEW MIX
            </PlasticButton>
          ) : (
            <div
              className="flex-1 h-[60px] flex items-center justify-center font-display text-[12px] tracking-[0.1em] rounded-[10px]"
              style={{
                background: '#0a0a0a',
                border: '2px solid var(--color-muted-2)',
                color: 'var(--color-muted)',
              }}
            >
              WAITING FOR THE CONDUCTOR…
            </div>
          )}
          <PlasticButton
            onClick={() => navigate('/')}
            color="dark"
            className="h-[60px] px-6 text-[12px] flex items-center justify-center"
          >
            EXIT
          </PlasticButton>
        </div>
      </div>
    </div>
  )
}

export default GameOverPage
