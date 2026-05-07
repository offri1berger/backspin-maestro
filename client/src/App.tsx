import LobbyPage from './pages/LobbyPage'
import { useSocket } from './hooks/useSocket'

const App = () => {
  useSocket()
  return <LobbyPage />
}

export default App