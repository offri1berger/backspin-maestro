import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import socket from '../socket'
import { useGameStore, loadSession, clearSession } from '../store/gameStore'

export const useSocket = () => {
  const navigate = useNavigate()
  // navigate is stable in react-router v7, but the lint rule doesn't know that.
  // Funnel it through a ref so the effect can stay register-once.
  const navigateRef = useRef(navigate)
  useEffect(() => { navigateRef.current = navigate }, [navigate])

  useEffect(() => {
    const navigate = (to: string) => navigateRef.current(to)
    let placementResultTimer: ReturnType<typeof setTimeout> | null = null

    socket.on('connect', () => {
      const store = useGameStore.getState()
      const saved = loadSession()
      if (!saved) {
        store.setConnectionStatus('connected')
        return
      }
      socket.emit('room:rejoin', saved, (result) => {
        if (!result.success || result.roomStatus === 'finished') {
          clearSession()
          const s = useGameStore.getState()
          if (s.roomCode === saved.roomCode) {
            s.leaveRoom()
            s.setConnectionStatus('expired')
            navigate('/')
          } else {
            s.setConnectionStatus('connected')
          }
          return
        }
        const s = useGameStore.getState()
        if (s.roomCode && s.roomCode !== saved.roomCode) {
          s.setConnectionStatus('connected')
          return
        }
        if (result.roomStatus === 'playing' && result.gameState) {
          s.restoreSession({
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
          s.restoreSession({
            roomCode: saved.roomCode,
            playerId: saved.playerId,
            players: result.players,
            settings: result.settings,
          })
          navigate('/lobby')
        }
        s.setConnectionStatus('connected')
      })
    })

    socket.on('disconnect', () => {
      const s = useGameStore.getState()
      // Only show the banner when there's actually a session at risk —
      // a disconnect on the lobby (no room yet) is just noise.
      if (s.roomCode) s.setConnectionStatus('reconnecting')
    })

    socket.io.on('reconnect_attempt', () => {
      const s = useGameStore.getState()
      if (s.roomCode) s.setConnectionStatus('reconnecting')
    })

    socket.connect()

    socket.on('player:joined', (player) => {
      useGameStore.getState().addPlayer(player)
    })

    socket.on('player:left', (playerId) => {
      useGameStore.getState().removePlayer(playerId)
    })

    socket.on('game:starting', (state, players) => {
      useGameStore.getState().setGameStarted(players, state.phase, state.currentPlayerId)
      navigate('/game')
    })

    socket.on('song:new', (song) => {
      const store = useGameStore.getState()
      store.setCurrentSong(song)
      store.setIsWaitingForNextTurn(false)
      store.setHasGuessed(false)
      store.setStealResult(null)
      store.setIsStealWindowOpen(false)
      store.setStealInitiatorId(null)
      store.setStealTargetId(null)
      store.setStealOriginalPosition(null)
    })

    socket.on('steal:open', (targetPlayerId, originalPosition) => {
      const store = useGameStore.getState()
      store.setIsWaitingForNextTurn(true)
      store.setIsStealWindowOpen(true)
      store.setStealTargetId(targetPlayerId)
      store.setStealOriginalPosition(originalPosition)
    })

    socket.on('steal:extended', (stealerId) => {
      useGameStore.getState().setStealInitiatorId(stealerId)
    })

    socket.on('phase:changed', (phase, _phaseStartedAt, currentPlayerId) => {
      const store = useGameStore.getState()
      store.setPhase(phase)
      if (currentPlayerId) store.setCurrentPlayerId(currentPlayerId)
    })

    socket.on('placement:result', (result) => {
      const store = useGameStore.getState()

      if (result.correct) {
        const currentSong = store.currentSong
        if (currentSong) {
          const updatedPlayers = store.players.map((p) => {
            if (p.id !== result.playerId) return p
            const newEntry = { song: currentSong, position: result.correctPosition }
            const newTimeline = [...p.timeline, newEntry].sort((a, b) => a.song.year - b.song.year)
            return { ...p, timeline: newTimeline }
          })
          store.setPlayers(updatedPlayers)
        }
      }

      store.setRemoteDragSlot(null)
      store.setPendingPosition(null)
      store.setIsStealWindowOpen(false)
      store.setPlacementResult({
        correct: result.correct,
        song: result.correct ? undefined : result.song,
      })
      store.setIsWaitingForNextTurn(true)
      if (placementResultTimer) clearTimeout(placementResultTimer)
      placementResultTimer = setTimeout(() => store.setPlacementResult(null), result.correct ? 2000 : 3000)
    })

    socket.on('token:earned', (playerId, newTotal) => {
      const store = useGameStore.getState()
      const updatedPlayers = store.players.map((p) =>
        p.id === playerId ? { ...p, tokens: newTotal } : p
      )
      store.setPlayers(updatedPlayers)
      if (playerId === store.playerId) {
        if (placementResultTimer) clearTimeout(placementResultTimer)
        store.setPlacementResult({ correct: true, message: '🪙 Token earned!' })
        placementResultTimer = setTimeout(() => store.setPlacementResult(null), 2000)
      }
    })

    socket.on('steal:result', (result) => {
      const store = useGameStore.getState()

      if (result.correct) {
        const updatedPlayers = store.players.map((p) => {
          if (p.id !== result.stealerId) return p
          const newTimeline = [...p.timeline, { song: result.song, position: 0 }]
            .sort((a, b) => a.song.year - b.song.year)
            .map((entry, idx) => ({ ...entry, position: idx }))
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
      if (placementResultTimer) clearTimeout(placementResultTimer)
      socket.off('connect')
      socket.off('disconnect')
      socket.io.off('reconnect_attempt')
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
