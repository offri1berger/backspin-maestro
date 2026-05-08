import { useGameStore } from '../store/gameStore'
import AudioPlayer from '../components/game/AudioPlayer'
import Timeline from '../components/game/Timeline'
import socket from '../socket'
import { useState } from 'react'

const GamePage = () => {
  const { currentSong, players, currentPlayerId, playerId, phase, placementResult, isWaitingForNextTurn } = useGameStore()
  const isMyTurn = currentPlayerId === playerId

const [lastResult, setLastResult] = useState<{ correct: boolean } | null>(null)

  const handlePlace = (position: number) => {
    socket.emit('card:place', { position }, (error) => {
      if (error) console.error('place error:', error)
    })
  }

  const myPlayer = players.find((p) => p.id === playerId)

  return (
    
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-lg mx-auto flex flex-col gap-6">
{placementResult && (
  <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl font-bold text-lg transition-all ${
    placementResult.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
  }`}>
    {placementResult.correct ? '✓ Correct!' : '✗ Wrong!'}
  </div>
)}
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
            isWaiting={isWaitingForNextTurn}
          />
        )}

      </div>
    </div>
  )
}

export default GamePage