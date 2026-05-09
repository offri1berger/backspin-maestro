import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import socket from '../socket'
import { PlayerRail } from '../components/game/PlayerRail'
import { GuessRail } from '../components/game/GuessRail'
import { GameStage } from '../components/game/GameStage'
import { StealOverlay } from '../components/game/StealOverlay'
import { ResultToast } from '../components/game/ResultToast'

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-display)', fontSize: 20 }}>
    <div className="vinyl" style={{ width: 22, height: 22, flexShrink: 0 }} />
    <span style={{ color: 'var(--on-bg)' }}>Hitster</span>
  </div>
)

const GamePage = () => {
  const {
    players, currentPlayerId, playerId, isWaitingForNextTurn,
    stealResult, isStealWindowOpen, stealInitiatorId,
    setHasGuessed, setRemoteDragSlot,
  } = useGameStore()

  const isMyTurn = currentPlayerId === playerId
  const myPlayer = players.find((p) => p.id === playerId)
  const canSteal = !isMyTurn && isStealWindowOpen && stealResult === null && (myPlayer?.tokens ?? 0) >= 1

  const [guess, setGuess] = useState({ artist: '', title: '' })
  const [isAttemptingSteal, setIsAttemptingSteal] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [stealWindowSeconds, setStealWindowSeconds] = useState(5)

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

  const handlePlace = (position: number) => {
    if (guess.artist.trim() && guess.title.trim()) {
      socket.emit('song:guess', { artist: guess.artist, title: guess.title })
    }
    socket.emit('card:place', { position }, (error) => { if (error) console.error('place error:', error) })
    setGuess({ artist: '', title: '' })
    setHasGuessed(true)
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <ResultToast />

      {/* Top bar */}
      <div style={{
        padding: '16px 28px', borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Logo />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>Room</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, letterSpacing: '0.18em', color: 'var(--accent)', fontWeight: 600 }}>
            {useGameStore.getState().roomCode ?? '—'}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            {players.length} players
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          First to 10 cards wins
        </span>
      </div>

      {/* Three-column body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr 300px', minHeight: 0 }}>
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
      {isStealWindowOpen && (() => {
        const stealerName = stealInitiatorId ? players.find((p) => p.id === stealInitiatorId)?.name : null
        return (
          <div style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            zIndex: 30, display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 20px', borderRadius: 999,
            background: 'var(--surface)', border: `1px solid ${stealerName ? 'var(--accent)' : 'var(--line)'}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}>
            {stealerName ? (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                ⚡ {stealerName} is stealing…
              </span>
            ) : (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                steal window
              </span>
            )}
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1, color: countdown <= 3 ? 'var(--bad)' : 'var(--accent)' }}>
              {countdown}
            </span>
          </div>
        )
      })()}

      {/* Steal button */}
      {canSteal && (
        <button
          onClick={handleStealInitiate}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 30,
            padding: '12px 20px', borderRadius: 999,
            background: 'var(--accent)', color: 'var(--accent-ink)',
            border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}
        >
          Steal! · 1 ★
        </button>
      )}
    </div>
  )
}

export default GamePage
