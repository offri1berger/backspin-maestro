import { Navigate, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { WaitingRoom } from '../components/lobby/WaitingRoom'
import socket from '../socket'

const WaitingRoomPage = () => {
  const navigate = useNavigate()
  const { roomCode, players, leaveRoom } = useGameStore()

  if (!roomCode) return <Navigate to="/" replace />

  const handleStart = () => {
    socket.emit('game:start', (error) => { if (error) alert(error) })
  }

  const handleLeave = () => {
    socket.emit('room:leave')
    leaveRoom()
    navigate('/')
  }

  return (
    <WaitingRoom
      roomCode={roomCode}
      players={players}
      onStart={handleStart}
      onLeave={handleLeave}
    />
  )
}

export default WaitingRoomPage
