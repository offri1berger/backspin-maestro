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
    })

    socket.on('phase:changed', (phase) => {
      setPhase(phase)
    })

    return () => {
      socket.off('player:joined')
      socket.off('player:left')
      socket.off('game:starting')
      socket.off('song:new')
      socket.off('phase:changed')
      socket.disconnect()
    }
  }, [])
}