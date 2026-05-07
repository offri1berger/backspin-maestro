import { useGameStore } from '../store/gameStore'
import AudioPlayer from '../components/game/AudioPlayer'

const GamePage = () => {
  const { currentSong, players, currentPlayerId, playerId } = useGameStore()
  const isMyTurn = currentPlayerId === playerId

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-lg mx-auto flex flex-col gap-6">

        <div className="flex justify-between items-center">
          {players.map((p) => (
            <div
              key={p.id}
              className={`text-center px-3 py-2 rounded-lg ${
                p.id === currentPlayerId ? 'bg-zinc-700' : ''
              }`}
            >
              <p className="text-sm">{p.name}</p>
              <p className="text-xs text-zinc-400">{p.tokens} tokens</p>
            </div>
          ))}
        </div>

        {currentSong && <AudioPlayer song={currentSong} />}

        <div className="text-center text-zinc-400 text-sm">
          {isMyTurn ? 'Your turn — place the song on your timeline' : `Waiting for ${players.find(p => p.id === currentPlayerId)?.name}...`}
        </div>

      </div>
    </div>
  )
}

export default GamePage