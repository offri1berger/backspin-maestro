import { StealOverlay } from '../components/game/StealOverlay'
import { ResultToast } from '../components/game/ResultToast'
import { useGamePage } from './game/useGamePage'
import GamePageDesktop from './game/GamePageDesktop'
import GamePageMobile from './game/GamePageMobile'

const GamePage = () => {
  const state = useGamePage()

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <ResultToast />
      {state.isAttemptingSteal && (
        <StealOverlay
          countdown={state.countdown}
          onStealAttempt={state.handleStealAttempt}
          onClose={() => state.setIsAttemptingSteal(false)}
        />
      )}
      <GamePageDesktop {...state} />
      <GamePageMobile {...state} />
    </div>
  )
}

export default GamePage
