import { Routes, Route, Navigate } from 'react-router-dom'
import { useSocket } from './hooks/useSocket'
import LobbyPage from './pages/LobbyPage'
import WaitingRoomPage from './pages/WaitingRoomPage'
import GamePage from './pages/GamePage'
import GameOverPage from './pages/GameOverPage'
import ConnectionBanner from './components/ConnectionBanner'

const App = () => {
  useSocket()

  return (
    <>
      <ConnectionBanner />
      <Routes>
        <Route path="/" element={<LobbyPage />} />
        <Route path="/lobby" element={<WaitingRoomPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/over" element={<GameOverPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
