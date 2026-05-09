import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import socket from '../socket'
import { PlayerRail } from '../components/game/PlayerRail'
import { GuessRail } from '../components/game/GuessRail'
import { GameStage } from '../components/game/GameStage'
import { StealOverlay } from '../components/game/StealOverlay'
import { ResultToast } from '../components/game/ResultToast'
import AudioPlayer from '../components/game/AudioPlayer'

const Logo = () => (
  <div className="flex items-center gap-2 font-display text-xl">
    <div className="vinyl w-[22px] h-[22px] shrink-0" />
    <span className="text-on-bg">Hitster</span>
  </div>
)

const GamePage = () => {
  const {
    players, currentPlayerId, playerId, isWaitingForNextTurn,
    stealResult, isStealWindowOpen, stealInitiatorId, currentSong,
    setHasGuessed, setRemoteDragSlot,
  } = useGameStore()

  const isMyTurn = currentPlayerId === playerId
  const myPlayer = players.find((p) => p.id === playerId)
  const canSteal = !isMyTurn && isStealWindowOpen && stealResult === null && (myPlayer?.tokens ?? 0) >= 1

  const [guess, setGuess] = useState({ artist: '', title: '' })
  const [isAttemptingSteal, setIsAttemptingSteal] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [stealWindowSeconds, setStealWindowSeconds] = useState(5)

  // Mobile: controlled pending position + confirmed state
  const [mobilePending, setMobilePending] = useState<number | null>(null)
  const [mobileConfirmed, setMobileConfirmed] = useState(false)

  useEffect(() => {
    if (mobilePending === null) setMobileConfirmed(false)
  }, [mobilePending])

  useEffect(() => {
    socket.on('drag:update', (slot) => setRemoteDragSlot(slot))
    return () => { socket.off('drag:update') }
  }, [setRemoteDragSlot])

  useEffect(() => { if (stealInitiatorId) setStealWindowSeconds(10) }, [stealInitiatorId])
  useEffect(() => { setRemoteDragSlot(null) }, [currentPlayerId, setRemoteDragSlot])
  useEffect(() => { if (!isStealWindowOpen) setIsAttemptingSteal(false) }, [isStealWindowOpen])

  useEffect(() => {
    if (!isStealWindowOpen) { setCountdown(0); setStealWindowSeconds(5); return }
    setCountdown(stealWindowSeconds)
    const iv = setInterval(() => setCountdown((c) => (c <= 1 ? (clearInterval(iv), 0) : c - 1)), 1000)
    return () => clearInterval(iv)
  }, [isStealWindowOpen, stealWindowSeconds])

  const handlePlace = (position: number, onError?: () => void) => {
    if (guess.artist.trim() && guess.title.trim()) {
      socket.emit('song:guess', { artist: guess.artist, title: guess.title })
    }
    socket.emit('card:place', { position }, (error) => {
      if (error) { console.error('place error:', error); onError?.(); return }
      setGuess({ artist: '', title: '' })
      setHasGuessed(true)
    })
  }

  const handleSkip = () => {
    socket.emit('song:skip', (error) => { if (error) console.error('skip error:', error) })
  }

  const handleStealAttempt = (position: number) => {
    if (!currentPlayerId) return
    socket.emit('steal:attempt', { targetPlayerId: currentPlayerId, position }, (error) => {
      if (error) console.error('steal error:', error)
    })
    setIsAttemptingSteal(false)
  }

  const handleStealInitiate = () => {
    socket.emit('steal:initiated', playerId ?? '')
    setIsAttemptingSteal(true)
  }

  const roomCode = useGameStore((s) => s.roomCode) ?? '—'
  const stealerName = stealInitiatorId ? players.find((p) => p.id === stealInitiatorId)?.name : null

  if (isAttemptingSteal) {
    return (
      <StealOverlay
        countdown={countdown}
        onStealAttempt={handleStealAttempt}
        onClose={() => setIsAttemptingSteal(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <ResultToast />

      {/* ── DESKTOP layout (lg+) ────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col flex-1 min-h-0">
        {/* Top bar */}
        <div className="px-7 py-4 border-b border-line flex items-center justify-between bg-bg shrink-0">
          <div className="flex items-center gap-6">
            <Logo />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">Room</span>
            <span className="font-mono text-base tracking-[0.18em] text-accent font-semibold">
              {roomCode}
            </span>
            <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">
              {players.length} players
            </span>
          </div>
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">
            First to 10 cards wins
          </span>
        </div>

        {/* Three-column body */}
        <div className="flex-1 grid min-h-0" style={{ gridTemplateColumns: '260px 1fr 300px' }}>
          <PlayerRail />
          <GameStage onPlace={handlePlace} onSkip={handleSkip} />
          <GuessRail
            guess={guess}
            onGuessChange={(field, value) => setGuess((g) => ({ ...g, [field]: value }))}
            isMyTurn={isMyTurn}
            isWaiting={isWaitingForNextTurn}
          />
        </div>

        {/* Steal window countdown pill */}
        {isStealWindowOpen && (
          <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-2.5 rounded-full bg-surface border ${stealerName ? 'border-accent' : 'border-line'}`}
            style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
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
        )}

        {/* Steal button */}
        {canSteal && (
          <button
            onClick={handleStealInitiate}
            className="fixed bottom-6 right-6 z-30 px-5 py-3 rounded-full bg-accent text-accent-ink border-0 cursor-pointer font-body font-bold text-sm"
            style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
          >
            Steal! · 1 ★
          </button>
        )}
      </div>

      {/* ── MOBILE layout (below lg) ────────────────────────────────────────── */}
      <div className="flex flex-col lg:hidden" style={{ minHeight: '100dvh' }}>
        {/* Top bar */}
        <div className="px-4 py-2.5 border-b border-line flex items-center justify-between bg-bg shrink-0">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">
              {players.length}p · first to 10
            </span>
            <span className="font-mono text-[11px] tracking-[0.18em] text-accent font-semibold">
              {roomCode}
            </span>
          </div>
        </div>

        {/* Player bar — equal-width cards, full width, no scroll */}
        <div className="flex gap-2 px-3 py-2.5 border-b border-line bg-bg shrink-0">
          {players.map((p) => {
            const active = p.id === currentPlayerId
            return (
              <div
                key={p.id}
                style={{
                  flex: 1,
                  padding: '10px 8px 8px',
                  borderRadius: 14,
                  background: active ? 'var(--color-accent)' : 'transparent',
                  color: active ? 'var(--color-accent-ink)' : 'var(--color-on-bg)',
                  border: active ? 'none' : '1px solid var(--color-line)',
                  textAlign: 'center' as const,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 13, fontWeight: 600,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                >
                  {p.name}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10, letterSpacing: '0.08em',
                    marginTop: 2, opacity: 0.8,
                  }}
                >
                  {p.timeline.length}/10 · {p.tokens}★
                </div>
              </div>
            )
          })}
        </div>

        {/* Scrollable timeline area */}
        <div
          className="flex-1 overflow-y-auto px-4 pt-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 360px)' }}
        >
          <GameStage
            onPlace={handlePlace}
            onSkip={handleSkip}
            showAudioPlayer={false}
            showSkipButton={false}
            vertical={true}
            pendingPosition={mobilePending}
            onPendingChange={setMobilePending}
            showPlaceButton={false}
          />
        </div>

        {/* Fixed bottom sheet */}
        <div
          className="fixed bottom-0 left-0 right-0 bg-bg border-t border-line z-20 px-4 pt-3 flex flex-col gap-2"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
        >
          {/* Steal window status */}
          {isStealWindowOpen && (
            <div
              className={`flex items-center justify-between px-4 py-2 rounded-full bg-surface border ${stealerName ? 'border-accent' : 'border-line'}`}
            >
              <span className={`font-mono tracking-[0.1em] uppercase ${stealerName ? 'text-accent' : 'text-muted'}`} style={{ fontSize: 10 }}>
                {stealerName ? `⚡ ${stealerName} is stealing…` : 'steal window open'}
              </span>
              <span className={`font-display text-[22px] leading-none ${countdown <= 3 ? 'text-bad' : 'text-accent'}`}>
                {countdown}
              </span>
            </div>
          )}

          {/* Compact audio player */}
          {currentSong && (
            <AudioPlayer song={currentSong} isMyTurn={isMyTurn} compact />
          )}

          {/* Steal button */}
          {canSteal && (
            <button
              onClick={handleStealInitiate}
              className="w-full rounded-full bg-accent text-accent-ink border-0 cursor-pointer font-body font-bold flex items-center justify-center"
              style={{ height: 48, fontSize: 15 }}
            >
              Steal! · 1 ★
            </button>
          )}

          {/* Guess inputs (only on my turn, before placing) */}
          {isMyTurn && !isWaitingForNextTurn && !mobileConfirmed && (
            <div className="flex flex-col gap-2">
              {(['artist', 'title'] as const).map((field) => (
                <input
                  key={field}
                  placeholder={`${field.charAt(0).toUpperCase() + field.slice(1)} (optional bonus guess)`}
                  value={guess[field]}
                  onChange={(e) => setGuess((g) => ({ ...g, [field]: e.target.value }))}
                  className="h-12 rounded-xl border border-line bg-transparent text-on-bg px-4 font-body outline-none w-full"
                  style={{ fontSize: 16 }}
                />
              ))}
            </div>
          )}

          {/* Skip button (only when no pending placement) */}
          {isMyTurn && !isWaitingForNextTurn && !mobileConfirmed && mobilePending === null && (myPlayer?.tokens ?? 0) >= 1 && (
            <button
              onClick={handleSkip}
              className="w-full rounded-full bg-transparent border border-line font-mono tracking-[0.12em] uppercase text-muted cursor-pointer"
              style={{ height: 40, fontSize: 11 }}
            >
              Skip · spend 1 ★
            </button>
          )}

          {/* Lock in placement button */}
          {isMyTurn && !isWaitingForNextTurn && mobilePending !== null && !mobileConfirmed && (
            <button
              onClick={() => {
                setMobileConfirmed(true)
                handlePlace(mobilePending, () => setMobileConfirmed(false))
              }}
              className="w-full rounded-full bg-accent text-accent-ink border-0 cursor-pointer font-body font-semibold flex items-center justify-center gap-2"
              style={{ height: 56, fontSize: 16 }}
            >
              Lock in placement
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default GamePage
