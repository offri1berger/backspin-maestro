import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useSocket } from './hooks/useSocket'
import LobbyPage from './pages/LobbyPage'
import ConnectionBanner from './components/ConnectionBanner'
import KickNotice from './components/KickNotice'

const WaitingRoomPage = lazy(() => import('./pages/WaitingRoomPage'))
const GamePage = lazy(() => import('./pages/GamePage'))
const GameOverPage = lazy(() => import('./pages/GameOverPage'))

const App = () => {
  useSocket()

  return (
    <>
      <ConnectionBanner />
      <KickNotice />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<LobbyPage />} />
          <Route path="/lobby" element={<WaitingRoomPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/over" element={<GameOverPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
