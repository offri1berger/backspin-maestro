import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import socket from '../socket'
import { useGameStore, loadSession, clearSession } from '../store/gameStore'

export const useSocket = () => {
  const navigate = useNavigate()
  const { addPlayer, removePlayer, setGameStarted, setCurrentSong, setPhase } = useGameStore()

  useEffect(() => {
    socket.on('connect', () => {
      const saved = loadSession()
      if (!saved) return
      socket.emit('room:rejoin', saved, (result) => {
        if (!result.success || result.roomStatus === 'finished') {
          clearSession()
          return
        }
        const store = useGameStore.getState()
        if (result.roomStatus === 'playing' && result.gameState) {
          store.restoreSession({
            roomCode: saved.roomCode,
            playerId: saved.playerId,
            players: result.players,
            settings: result.settings,
            phase: result.gameState.phase,
            currentPlayerId: result.gameState.currentPlayerId,
            currentSong: result.gameState.currentSong,
            roundNumber: result.gameState.roundNumber,
          })
          navigate('/game')
        } else {
          store.restoreSession({
            roomCode: saved.roomCode,
            playerId: saved.playerId,
            players: result.players,
            settings: result.settings,
          })
          navigate('/lobby')
        }
      })
    })

    socket.connect()

    socket.on('player:joined', (player) => {
      addPlayer(player)
    })

    socket.on('player:left', (playerId) => {
      removePlayer(playerId)
    })

    socket.on('game:starting', (state, players) => {
      setGameStarted(players, state.phase, state.currentPlayerId)
      navigate('/game')
    })

    socket.on('song:new', (song) => {
      const store = useGameStore.getState()
      setCurrentSong(song)
      store.setIsWaitingForNextTurn(false)
      store.setHasGuessed(false)
      store.setStealResult(null)
      store.setIsStealWindowOpen(false)
      store.setStealInitiatorId(null)
    })

    socket.on('steal:open', () => {
      const store = useGameStore.getState()
      store.setIsWaitingForNextTurn(true)
      store.setIsStealWindowOpen(true)
    })

    socket.on('steal:extended', (stealerId) => {
      useGameStore.getState().setStealInitiatorId(stealerId)
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

      store.setRemoteDragSlot(null)
      store.setPendingPosition(null)
      store.setIsStealWindowOpen(false)
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

    socket.on('steal:result', (result) => {
      const store = useGameStore.getState()

      if (result.correct) {
        const updatedPlayers = store.players.map((p) => {
          if (p.id !== result.stealerId) return p
          const newEntry = { song: result.song, position: p.timeline.length }
          const newTimeline = [...p.timeline, newEntry].sort((a, b) => a.song.year - b.song.year)
          return { ...p, timeline: newTimeline }
        })
        store.setPlayers(updatedPlayers)
      }

      store.setStealInitiatorId(null)
      store.setStealResult(result)
      setTimeout(() => store.setStealResult(null), 3000)
    })

    socket.on('tokens:updated', (playerId, newTotal) => {
      const store = useGameStore.getState()
      store.setPlayers(store.players.map((p) =>
        p.id === playerId ? { ...p, tokens: newTotal } : p
      ))
    })

    socket.on('game:over', (winnerId, players) => {
      const store = useGameStore.getState()
      store.setPlayers(players)
      store.setGameOver(winnerId)
      navigate('/over')
    })

    socket.on('player:disconnected', (playerId) => {
      useGameStore.getState().setPlayerDisconnected(playerId)
    })

    socket.on('player:reconnected', (playerId) => {
      useGameStore.getState().setPlayerReconnected(playerId)
    })

    socket.on('host:transferred', (newHostId) => {
      useGameStore.getState().transferHost(newHostId)
    })

    socket.on('game:reset', (players) => {
      useGameStore.getState().resetGame(players)
      navigate('/lobby')
    })

    return () => {
      socket.off('connect')
      socket.off('player:joined')
      socket.off('player:left')
      socket.off('game:starting')
      socket.off('song:new')
      socket.off('phase:changed')
      socket.off('placement:result')
      socket.off('token:earned')
      socket.off('steal:open')
      socket.off('steal:extended')
      socket.off('steal:result')
      socket.off('tokens:updated')
      socket.off('game:over')
      socket.off('player:disconnected')
      socket.off('player:reconnected')
      socket.off('host:transferred')
      socket.off('game:reset')
      socket.disconnect()
    }
  }, [])
}
