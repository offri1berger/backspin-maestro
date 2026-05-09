import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import socket from '../socket'
import { PlayerRail } from '../components/game/PlayerRail'
import { GuessRail } from '../components/game/GuessRail'
import { GameStage } from '../components/game/GameStage'
import { StealOverlay } from '../components/game/StealOverlay'
import { ResultToast } from '../components/game/ResultToast'

const Logo = () => (
  <div className="flex items-center gap-2 font-display text-xl">
    <div className="vinyl w-[22px] h-[22px] shrink-0" />
    <span className="text-on-bg">Hitster</span>
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
    <div className="min-h-screen bg-bg flex flex-col">
      <ResultToast />

      {/* Top bar */}
      <div className="px-7 py-4 border-b border-line flex items-center justify-between bg-bg shrink-0">
        <div className="flex items-center gap-6">
          <Logo />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">Room</span>
          <span className="font-mono text-base tracking-[0.18em] text-accent font-semibold">
            {useGameStore.getState().roomCode ?? '—'}
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
      {isStealWindowOpen && (() => {
        const stealerName = stealInitiatorId ? players.find((p) => p.id === stealInitiatorId)?.name : null
        return (
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
        )
      })()}

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
  )
}

export default GamePage
