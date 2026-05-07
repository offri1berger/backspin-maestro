import { useState } from 'react'
import socket from '../socket'
import { useGameStore } from '../store/gameStore'

const LobbyPage = () => {
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [view, setView] = useState<'home' | 'create' | 'join'>('home')
  const { setRoom, setPlayers, players, roomCode: currentRoomCode } = useGameStore()

  const handleCreate = () => {
  if (!name.trim()) return
  socket.connect()
  socket.emit('room:create', {
    hostName: name,
    settings: { songsPerPlayer: 10, decadeFilter: 'all' },
  }, (result) => {
    setRoom(result.roomCode, result.playerId)
    setPlayers([{
      id: result.playerId,
      name,
      tokens: 0,
      isHost: true,
      turnOrder: 0,
      timeline: [],
    }])
  })
}

  const handleJoin = () => {
  if (!name.trim() || !roomCode.trim()) return
  socket.connect()
  socket.emit('room:join', {
    roomCode: roomCode.toUpperCase(),
    playerName: name,
  }, (result) => {
    if (!result.success) {
      alert(result.error)
      return
    }
    setRoom(result.roomCode!, result.playerId!)
    setPlayers([
      ...(result.players ?? []),
      {
        id: result.playerId!,
        name,
        tokens: 0,
        isHost: false,
        turnOrder: 0,
        timeline: [],
      }
    ])
  })
}

  const handleStart = () => {
    socket.emit('game:start', (error) => {
      if (error) alert(error)
    })
  }

  if (currentRoomCode) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="w-full max-w-sm bg-zinc-900 rounded-2xl p-8 flex flex-col gap-6">
          <div className="text-center">
            <p className="text-zinc-400 text-sm mb-1">room code</p>
            <h2 className="text-4xl font-bold tracking-widest">{currentRoomCode}</h2>
          </div>

          <div>
            <p className="text-zinc-400 text-xs uppercase tracking-wider mb-3">
              players ({players.length}/6)
            </p>
            <ul className="flex flex-col gap-2">
              {players.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3"
                >
                  <span>{p.name}</span>
                  {p.isHost && (
                    <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded-full">
                      host
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleStart}
            disabled={players.length < 2}
            className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Start game
          </button>
        </div>
      </div>
    )
  }

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="w-full max-w-sm flex flex-col gap-4 px-6">
          <h1 className="text-5xl font-bold text-center mb-4">Hitster</h1>
          <button
            onClick={() => setView('create')}
            className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition"
          >
            Create room
          </button>
          <button
            onClick={() => setView('join')}
            className="w-full bg-zinc-800 text-white font-semibold py-3 rounded-xl hover:bg-zinc-700 transition"
          >
            Join room
          </button>
        </div>
      </div>
    )
  }

  if (view === 'create') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="w-full max-w-sm flex flex-col gap-4 px-6">
          <button onClick={() => setView('home')} className="text-zinc-400 text-sm self-start">
            ← back
          </button>
          <h2 className="text-3xl font-bold">Create room</h2>
          <input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-800 text-white placeholder-zinc-500 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-white"
          />
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Create
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="w-full max-w-sm flex flex-col gap-4 px-6">
        <button onClick={() => setView('home')} className="text-zinc-400 text-sm self-start">
          ← back
        </button>
        <h2 className="text-3xl font-bold">Join room</h2>
        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-zinc-800 text-white placeholder-zinc-500 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-white"
        />
        <input
          placeholder="Room code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          className="w-full bg-zinc-800 text-white placeholder-zinc-500 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-white uppercase tracking-widest"
        />
        <button
          onClick={handleJoin}
          disabled={!name.trim() || !roomCode.trim()}
          className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Join
        </button>
      </div>
    </div>
  )
}

export default LobbyPage