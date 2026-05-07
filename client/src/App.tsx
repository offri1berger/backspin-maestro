import { useSocket } from './hooks/useSocket'
import { useGameStore } from './store/gameStore'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'

const App = () => {
  useSocket()
  const phase = useGameStore((s) => s.phase)

  return phase ? <GamePage /> : <LobbyPage />
}

export default App