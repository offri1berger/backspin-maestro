import { useState } from 'react'
import type { Decade } from '@hitster/shared'
import socket from '../socket'
import { useGameStore } from '../store/gameStore'
import { WaitingRoom } from '../components/lobby/WaitingRoom'
import { HeroPanel } from '../components/lobby/HeroPanel'
import { SetupForm } from '../components/lobby/SetupForm'

const LobbyPage = () => {
  const [name, setName]         = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [tab, setTab]           = useState<'create' | 'join'>('create')
  const [decade, setDecade]     = useState<Decade>('all')
  const [avatar, setAvatar]     = useState<string | undefined>(undefined)

  const { setRoom, setPlayers, players, roomCode: currentRoomCode } = useGameStore()

  const handleCreate = () => {
    if (!name.trim()) return
    socket.connect()
    socket.emit('room:create', {
      hostName: name,
      avatar,
      settings: { songsPerPlayer: 2, decadeFilter: decade },
    }, (result) => {
      setRoom(result.roomCode, result.playerId)
      setPlayers([{ id: result.playerId, name, avatar, tokens: 2, isHost: true, turnOrder: 0, timeline: [] }])
    })
  }

  const handleJoin = () => {
    if (!name.trim() || !roomCode.trim()) return
    socket.connect()
    socket.emit('room:join', { roomCode: roomCode.toUpperCase(), playerName: name, avatar }, (result) => {
      if (!result.success) { alert(result.error); return }
      setRoom(result.roomCode!, result.playerId!)
      setPlayers([
        ...(result.players ?? []),
        { id: result.playerId!, name, avatar, tokens: 0, isHost: false, turnOrder: 0, timeline: [] },
      ])
    })
  }

  const handleStart = () => {
    socket.emit('game:start', (error) => { if (error) alert(error) })
  }

  if (currentRoomCode) {
    return <WaitingRoom roomCode={currentRoomCode} players={players} onStart={handleStart} />
  }

  return (
    <div className="min-h-screen bg-bg lg:grid lg:grid-cols-[1.1fr_1fr]">
      <div className="hidden lg:block">
        <HeroPanel />
      </div>
      <SetupForm
        tab={tab}           onTabChange={setTab}
        name={name}         onNameChange={setName}
        roomCode={roomCode} onRoomCodeChange={setRoomCode}
        decade={decade}     onDecadeChange={setDecade}
        avatar={avatar}     onAvatarChange={setAvatar}
        onSubmit={tab === 'create' ? handleCreate : handleJoin}
      />
    </div>
  )
}

export default LobbyPage

