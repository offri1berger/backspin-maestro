import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore'
import socket from '../../socket'
import { sfx } from '../../lib/sfx'

export const useGamePage = () => {
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

  // Steal-window tick: subtle click on the last 3 seconds.
  useEffect(() => {
    if (isStealWindowOpen && countdown > 0 && countdown <= 3) sfx.tick()
  }, [isStealWindowOpen, countdown])

  const handlePlace = (position: number, onError?: () => void) => {
    if (guess.artist.trim() && guess.title.trim()) {
      socket.emit('song:guess', { artist: guess.artist, title: guess.title })
    }
    const snapshot = useGameStore.getState()
    socket.emit('card:place', { position }, (result) => {
      if ('error' in result) {
        console.error('place error:', result.error, {
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
    socket.emit('song:skip', (result) => { if ('error' in result) console.error('skip error:', result.error) })
  }

  const handleStealAttempt = (position: number) => {
    if (!currentPlayerId) return
    socket.emit('steal:attempt', { targetPlayerId: currentPlayerId, position }, (result) => {
      if ('error' in result) console.error('steal error:', result.error)
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

  const onGuessChange = (field: 'artist' | 'title', value: string) =>
    setGuess((g) => ({ ...g, [field]: value }))

  return {
    roomCode,
    players,
    songsToWin,
    isMyTurn,
    myPlayer,
    canSteal,
    isStealWindowOpen,
    isWaitingForNextTurn,
    stealResult,
    stealerName,
    countdown,
    guess,
    isAttemptingSteal,
    handlePlace,
    handleSkip,
    handleStealAttempt,
    handleStealInitiate,
    handleLeave,
    onGuessChange,
    setIsAttemptingSteal,
  }
}

export type GamePageProps = ReturnType<typeof useGamePage>
