import { useEffect, useState } from 'react'
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
    remoteDragSlot,
    setHasGuessed,
    setRemoteDragSlot,
  } = useGameStore()

  const isMyTurn = currentPlayerId === playerId
  const activePlayer = players.find((p) => p.id === currentPlayerId)
  const myPlayer = players.find((p) => p.id === playerId)
  const activeTimeline = activePlayer?.timeline ?? []
  const myTimeline = myPlayer?.timeline ?? []

  const [guess, setGuess] = useState({ artist: '', title: '' })
  const [viewingMyTimeline, setViewingMyTimeline] = useState(false)

  useEffect(() => {
    socket.on('drag:update', (slot) => setRemoteDragSlot(slot))
    return () => { socket.off('drag:update') }
  }, [setRemoteDragSlot])

  useEffect(() => {
    setRemoteDragSlot(null)
  }, [currentPlayerId, setRemoteDragSlot])

  useEffect(() => {
    if (isWaitingForNextTurn) setRemoteDragSlot(null)
  }, [isWaitingForNextTurn, setRemoteDragSlot])

  const handlePlace = (position: number) => {
    if (guess.artist.trim() && guess.title.trim()) {
      socket.emit('song:guess', { artist: guess.artist, title: guess.title })
    }
    socket.emit('card:place', { position }, (error: unknown) => {
      if (error) console.error('place error:', error)
    })
    setGuess({ artist: '', title: '' })
    setHasGuessed(true)
  }

  if (viewingMyTimeline) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-6">
        <div className="max-w-lg mx-auto flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewingMyTimeline(false)}
              className="text-zinc-400 hover:text-white transition text-sm"
            >
              ← Back
            </button>
            <h2 className="text-lg font-semibold">My Timeline</h2>
          </div>
          <Timeline timeline={myTimeline} readOnly />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-lg mx-auto flex flex-col gap-6">

        {placementResult?.correct && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl font-bold text-lg z-10 bg-green-500 text-white">
            {placementResult.message ?? '✓ Correct!'}
          </div>
        )}

        {placementResult && !placementResult.correct && placementResult.song && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-10 w-80">
            <div className="bg-red-600 rounded-t-2xl px-4 py-2 text-center font-bold text-white">
              ✗ Wrong!
            </div>
            <div className="bg-zinc-800 rounded-b-2xl px-4 py-3 flex justify-between items-center shadow-xl">
              <div>
                <p className="font-semibold text-sm text-white">{placementResult.song.title}</p>
                <p className="text-zinc-400 text-xs">{placementResult.song.artist}</p>
              </div>
              <span className="text-white font-bold text-sm">{placementResult.song.year}</span>
            </div>
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
            {!isMyTurn && activePlayer && (
              <p className="text-zinc-400 text-sm text-center">
                watching{' '}
                <span className="text-white font-medium">{activePlayer.name}</span>
                's turn
              </p>
            )}

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

            {isMyTurn && (
              <p className="text-zinc-400 text-sm text-center">
                drag the card to the correct spot
              </p>
            )}

            <Timeline
              timeline={activeTimeline}
              currentSong={currentSong}
              onPlace={handlePlace}
              isMyTurn={isMyTurn}
              isWaiting={isWaitingForNextTurn}
              spectatorDragSlot={isMyTurn ? null : remoteDragSlot}
            />
          </div>
        )}

      </div>

      {!isMyTurn && (
        <button
          onClick={() => setViewingMyTimeline(true)}
          className="fixed bottom-6 right-6 bg-zinc-800 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg hover:bg-zinc-700 transition"
        >
          My Timeline
        </button>
      )}
    </div>
  )
}

export default GamePage
