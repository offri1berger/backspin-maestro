import { useSocket } from './hooks/useSocket'
import { useGameStore } from './store/gameStore'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'
import GameOverPage from './pages/GameOverPage'

const App = () => {
  useSocket()
  const phase = useGameStore((s) => s.phase)

  if (phase === 'game_over') return <GameOverPage />
  if (phase) return <GamePage />
  return <LobbyPage />
}

export default App