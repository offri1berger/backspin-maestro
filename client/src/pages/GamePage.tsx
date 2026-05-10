import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import socket from '../socket'
import { PlayerRail } from '../components/game/PlayerRail'
import { GuessRail } from '../components/game/GuessRail'
import { GameStage } from '../components/game/GameStage'
import { StealOverlay } from '../components/game/StealOverlay'
import { ResultToast } from '../components/game/ResultToast'
import { Logo } from '../components/ui/Logo'
import StealPill from './game/StealPill'
import MobilePlayerBar from './game/MobilePlayerBar'
import MobileBottomSheet from './game/MobileBottomSheet'

const GamePage = () => {
  const navigate = useNavigate()
  const {
    players, currentPlayerId, playerId, isWaitingForNextTurn,
    stealResult, isStealWindowOpen, stealInitiatorId,
    setHasGuessed, setRemoteDragSlot, settings, leaveRoom,
  } = useGameStore()
  const songsToWin = settings?.songsPerPlayer ?? 10

  const isMyTurn = currentPlayerId === playerId
  const myPlayer = players.find((p) => p.id === playerId)
  const canSteal = !isMyTurn && isStealWindowOpen && stealResult === null && (myPlayer?.tokens ?? 0) >= 1

  const [guess, setGuess] = useState({ artist: '', title: '' })
  const [isAttemptingSteal, setIsAttemptingSteal] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Derived: steal window is longer when someone explicitly initiates
  const stealWindowSeconds = stealInitiatorId ? 10 : 5

  const [mobilePending, _setMobilePending] = useState<number | null>(null)
  const [mobileConfirmed, setMobileConfirmed] = useState(false)
  const setMobilePending = (val: number | null) => {
    _setMobilePending(val)
    if (val === null) setMobileConfirmed(false)
  }

  // Reset isAttemptingSteal when steal window closes via a store subscription
  // (setState is called inside the callback, not synchronously in the effect body)
  useEffect(() => {
    return useGameStore.subscribe((state, prev) => {
      if (prev.isStealWindowOpen && !state.isStealWindowOpen) setIsAttemptingSteal(false)
    })
  }, [])

  useEffect(() => {
    socket.on('drag:update', (slot) => setRemoteDragSlot(slot))
    return () => { socket.off('drag:update') }
  }, [setRemoteDragSlot])

  useEffect(() => { setRemoteDragSlot(null) }, [currentPlayerId, setRemoteDragSlot])

  useEffect(() => {
    if (!isStealWindowOpen) return
    const t = setTimeout(() => setCountdown(stealWindowSeconds), 0)
    const iv = setInterval(() => setCountdown((c) => (c <= 1 ? (clearInterval(iv), 0) : c - 1)), 1000)
    return () => { clearTimeout(t); clearInterval(iv); setCountdown(0) }
  }, [isStealWindowOpen, stealWindowSeconds])

  const handlePlace = (position: number, onError?: () => void) => {
    if (guess.artist.trim() && guess.title.trim()) {
      socket.emit('song:guess', { artist: guess.artist, title: guess.title })
    }
    const snapshot = useGameStore.getState()
    socket.emit('card:place', { position }, (error) => {
      if (error) {
        console.error('place error:', error, {
          clientPlayerId: snapshot.playerId,
          clientCurrentPlayerId: snapshot.currentPlayerId,
          isMyTurn: snapshot.currentPlayerId === snapshot.playerId,
          phase: snapshot.phase,
          isWaitingForNextTurn: snapshot.isWaitingForNextTurn,
          isStealWindowOpen: snapshot.isStealWindowOpen,
          position,
        })
        onError?.()
        return
      }
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
    socket.emit('steal:initiated')
    setIsAttemptingSteal(true)
  }

  const roomCode = useGameStore((s) => s.roomCode) ?? '—'
  const stealerName = stealInitiatorId
    ? (players.find((p) => p.id === stealInitiatorId)?.name ?? null)
    : null

  const handleLeave = () => {
    if (!window.confirm('Leave the game? You will be removed from the room.')) return
    socket.emit('room:leave')
    leaveRoom()
    navigate('/')
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

      {/* ── DESKTOP layout (lg+) ─────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col flex-1 min-h-0">
        <div className="px-7 py-4 border-b border-line flex items-center justify-between bg-bg shrink-0">
          <div className="flex items-center gap-6">
            <Logo />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">Room</span>
            <span className="font-mono text-base tracking-[0.18em] text-accent font-semibold">{roomCode}</span>
            <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">{players.length} players</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">First to {songsToWin} cards wins</span>
            <button
              onClick={handleLeave}
              className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted hover:text-on-bg cursor-pointer border-0 bg-transparent p-0 transition-colors"
            >
              Leave
            </button>
          </div>
        </div>

        <div className="flex-1 grid min-h-0 grid-cols-[260px_1fr_300px]">
          <PlayerRail />
          <GameStage onPlace={handlePlace} onSkip={handleSkip} />
          <GuessRail
            guess={guess}
            onGuessChange={(field, value) => setGuess((g) => ({ ...g, [field]: value }))}
            isMyTurn={isMyTurn}
            isWaiting={isWaitingForNextTurn}
          />
        </div>

        {isStealWindowOpen && <StealPill stealerName={stealerName} countdown={countdown} />}

        {canSteal && (
          <button
            onClick={handleStealInitiate}
            className="fixed bottom-6 right-6 z-30 px-5 py-3 rounded-full bg-accent text-accent-ink border-0 cursor-pointer font-body font-bold text-sm shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
          >
            Steal! · 1 ★
          </button>
        )}
      </div>

      {/* ── MOBILE layout (below lg) ─────────────────────────────────────── */}
      <div className="flex flex-col lg:hidden min-h-dvh">
        <div className="px-4 py-2.5 border-b border-line flex items-center justify-between bg-bg shrink-0">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">{players.length}p · first to {songsToWin}</span>
            <span className="font-mono text-[11px] tracking-[0.18em] text-accent font-semibold">{roomCode}</span>
            <button
              onClick={handleLeave}
              className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted hover:text-on-bg cursor-pointer border-0 bg-transparent p-0 transition-colors"
            >
              Leave
            </button>
          </div>
        </div>

        <MobilePlayerBar />

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

        <MobileBottomSheet
          isMyTurn={isMyTurn}
          canSteal={canSteal}
          mobilePending={mobilePending}
          mobileConfirmed={mobileConfirmed}
          guess={guess}
          myPlayer={myPlayer}
          stealerName={stealerName}
          countdown={countdown}
          onStealInitiate={handleStealInitiate}
          onSkip={handleSkip}
          onGuessChange={(field, value) => setGuess((g) => ({ ...g, [field]: value }))}
          onConfirm={() => {
            setMobileConfirmed(true)
            handlePlace(mobilePending!, () => setMobileConfirmed(false))
          }}
        />
      </div>
    </div>
  )
}

export default GamePage
