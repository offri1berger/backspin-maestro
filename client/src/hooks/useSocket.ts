import { useEffect } from 'react'
import socket from '../socket'
import { useGameStore } from '../store/gameStore'

export const useSocket = () => {
  const { addPlayer, removePlayer, setGameStarted, setCurrentSong, setPhase } = useGameStore()

  useEffect(() => {
    socket.connect()

    socket.on('player:joined', (player) => {
      addPlayer(player)
    })

    socket.on('player:left', (playerId) => {
      removePlayer(playerId)
    })

    socket.on('game:starting', (state, players) => {
      setGameStarted(players, state.phase, state.currentPlayerId)
    })

    socket.on('song:new', (song) => {
      setCurrentSong(song)
      useGameStore.getState().setIsWaitingForNextTurn(false)
      useGameStore.getState().setHasGuessed(false)
    })

    socket.on('phase:changed', (phase, _phaseStartedAt, currentPlayerId) => {
      setPhase(phase)
      if (currentPlayerId) useGameStore.getState().setCurrentPlayerId(currentPlayerId)
    })

    socket.on('placement:result', (result) => {
      const store = useGameStore.getState()

      if (result.correct) {
        const currentSong = store.currentSong
        if (!currentSong) return

        const updatedPlayers = store.players.map((p) => {
          if (p.id !== result.playerId) return p
          const newEntry = { song: currentSong, position: result.correctPosition }
          const newTimeline = [...p.timeline, newEntry].sort((a, b) => a.song.year - b.song.year)
          return { ...p, timeline: newTimeline }
        })

        store.setPlayers(updatedPlayers)
      }

      store.setPendingPosition(null)
      store.setPlacementResult({
        correct: result.correct,
        song: result.correct ? undefined : result.song,
      })
      store.setIsWaitingForNextTurn(true)
      setTimeout(() => store.setPlacementResult(null), result.correct ? 2000 : 3000)
    })

    socket.on('token:earned', (playerId, newTotal) => {
      const store = useGameStore.getState()
      const updatedPlayers = store.players.map((p) =>
        p.id === playerId ? { ...p, tokens: newTotal } : p
      )
      store.setPlayers(updatedPlayers)
      if (playerId === store.playerId) {
        store.setPlacementResult({ correct: true, message: '🪙 Token earned!' })
        setTimeout(() => store.setPlacementResult(null), 2000)
      }
    })

    socket.on('game:over', (winnerId, players) => {
      const store = useGameStore.getState()
      store.setPlayers(players)
      store.setGameOver(winnerId)
    })

    return () => {
      socket.off('player:joined')
      socket.off('player:left')
      socket.off('game:starting')
      socket.off('song:new')
      socket.off('phase:changed')
      socket.off('placement:result')
      socket.off('token:earned')
      socket.off('game:over')
      socket.disconnect()
    }
  }, [])
}