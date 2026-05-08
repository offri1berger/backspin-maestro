import { useGameStore } from '../store/gameStore'
import AudioPlayer from '../components/game/AudioPlayer'
import Timeline from '../components/game/Timeline'
import socket from '../socket'

const GamePage = () => {
  const { currentSong, players, currentPlayerId, playerId, phase } = useGameStore()
  const isMyTurn = currentPlayerId === playerId

  const handlePlace = (position: number) => {
    socket.emit('card:place', { position }, (error) => {
      if (error) console.error('place error:', error)
    })
  }

  const myPlayer = players.find((p) => p.id === playerId)

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
              <p className="text-xs text-zinc-400">{p.tokens} 🪙</p>
            </div>
          ))}
        </div>

        {currentSong && <AudioPlayer song={currentSong} isMyTurn={isMyTurn}/>}

        {currentSong && (
          <Timeline
            timeline={myPlayer?.timeline ?? []}
            currentSong={currentSong}
            onPlace={handlePlace}
            isMyTurn={isMyTurn}
          />
        )}

      </div>
    </div>
  )
}

export default GamePage