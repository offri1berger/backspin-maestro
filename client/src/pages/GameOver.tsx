import { useGameStore } from '../store/gameStore'

const GameOverPage = () => {
  const { players, winnerId, playerId } = useGameStore()
  const winner = players.find((p) => p.id === winnerId)
  const isWinner = winnerId === playerId

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="w-full max-w-sm flex flex-col gap-6 px-6 text-center">
        <div>
          <p className="text-6xl mb-4">{isWinner ? '🏆' : '😢'}</p>
          <h1 className="text-3xl font-bold mb-2">
            {isWinner ? 'You won!' : `${winner?.name} won!`}
          </h1>
          <p className="text-zinc-400">
            {isWinner ? 'Well played!' : 'Better luck next time'}
          </p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-xs text-zinc-400 uppercase tracking-wider">Final scores</p>
          {players
            .sort((a, b) => b.tokens - a.tokens)
            .map((p) => (
              <div key={p.id} className="flex justify-between items-center">
                <span className={p.id === winnerId ? 'font-bold' : ''}>{p.name}</span>
                <span className="text-zinc-400">{p.tokens} 🪙</span>
              </div>
            ))}
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition"
        >
          Play again
        </button>
      </div>
    </div>
  )
}

export default GameOverPage