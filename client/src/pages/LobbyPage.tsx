import { useState } from 'react'
import type { Decade } from '@hitster/shared'
import socket from '../socket'
import { useGameStore } from '../store/gameStore'
import { WaitingRoom } from '../components/lobby/WaitingRoom'
import { HeroPanel } from '../components/lobby/HeroPanel'
import { SetupForm } from '../components/lobby/SetupForm'
import { Logo } from '../components/ui/Logo'

const NAV_LINKS = ['How to play', 'Songbook', 'Sign in']

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
      settings: { songsPerPlayer: 5, decadeFilter: decade },
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
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-bg lg:grid lg:grid-rows-[auto_1fr] lg:grid-cols-[1.1fr_1fr]">
      {/* Full-width top nav — desktop only */}
      <div className="hidden lg:flex col-span-2 px-16 py-5 border-b border-line items-center justify-between">
        <Logo />
        <nav className="flex gap-7">
          {NAV_LINKS.map((l) => (
            <span key={l} className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted cursor-pointer">
              {l}
            </span>
          ))}
        </nav>
      </div>

      {/* Two-column content */}
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

