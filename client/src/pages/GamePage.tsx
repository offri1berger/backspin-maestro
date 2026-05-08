import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import AudioPlayer from '../components/game/AudioPlayer'
import Timeline from '../components/game/Timeline'
import socket from '../socket'

const GamePage = () => {
  const {
    currentSong,
    players,
    currentPlayerId,
    playerId,
    placementResult,
    isWaitingForNextTurn,
  } = useGameStore()

  const { setHasGuessed } = useGameStore()
  const isMyTurn = currentPlayerId === playerId
  const myPlayer = players.find((p) => p.id === playerId)

  const [guess, setGuess] = useState({ artist: '', title: '' })

  const handlePlace = (position: number) => {
    if (guess.artist.trim() && guess.title.trim()) {
      socket.emit('song:guess', { artist: guess.artist, title: guess.title })
    }
    socket.emit('card:place', { position }, (error) => {
      if (error) console.error('place error:', error)
    })
    setGuess({ artist: '', title: '' })
    setHasGuessed(true)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-lg mx-auto flex flex-col gap-6">

        {placementResult && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl font-bold text-lg ${
            placementResult.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {placementResult.message ?? (placementResult.correct ? '✓ Correct!' : '✗ Wrong!')}
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

        {currentSong && <AudioPlayer song={currentSong} isMyTurn={isMyTurn} />}

        {currentSong && (
          <div className="flex flex-col gap-3">
            {isMyTurn && !isWaitingForNextTurn && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-zinc-400 text-center">Optional: guess for a token 🪙</p>
                <div className="flex gap-2">
                  <input
                    placeholder="Artist"
                    value={guess.artist}
                    onChange={(e) => setGuess((g) => ({ ...g, artist: e.target.value }))}
                    className="flex-1 bg-zinc-800 text-white placeholder-zinc-500 px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-white"
                  />
                  <input
                    placeholder="Title"
                    value={guess.title}
                    onChange={(e) => setGuess((g) => ({ ...g, title: e.target.value }))}
                    className="flex-1 bg-zinc-800 text-white placeholder-zinc-500 px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-white"
                  />
                </div>
              </div>
            )}
            <Timeline
              timeline={myPlayer?.timeline ?? []}
              currentSong={currentSong}
              onPlace={handlePlace}
              isMyTurn={isMyTurn}
              isWaiting={isWaitingForNextTurn}
            />
          </div>
        )}

      </div>
    </div>
  )
}

export default GamePage