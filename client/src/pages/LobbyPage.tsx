import { useState } from 'react'
import socket from '../socket'
import { useGameStore } from '../store/gameStore'
import type { Decade } from '@hitster/shared'
import ImagePicker from '../components/ImagePicker'
import { AVATARS } from '../lib/avatars'

const DECADES: { label: string; value: Decade }[] = [
  { label: 'All', value: 'all' },
  { label: '60s', value: '60s' },
  { label: '70s', value: '70s' },
  { label: '80s', value: '80s' },
  { label: '90s', value: '90s' },
  { label: '00s', value: '00s' },
  { label: '10s', value: '10s' },
]

function Logo() {
  return (
    <div className="flex items-center gap-2 font-display text-[22px] tracking-[-0.01em] text-on-bg">
      <div style={{ width: 28, height: 28 }} className="vinyl" />
      <span>Hitster</span>
    </div>
  )
}

const LobbyPage = () => {
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [decade, setDecade] = useState<Decade>('all')
  const [avatar, setAvatar] = useState<string | undefined>(undefined)
  const { setRoom, setPlayers, players, roomCode: currentRoomCode } = useGameStore()

  const handleCreate = () => {
    if (!name.trim()) return
    socket.connect()
    socket.emit('room:create', {
      hostName: name,
      avatar,
      settings: { songsPerPlayer: 10, decadeFilter: decade.toLowerCase() as Decade },
    }, (result) => {
      setRoom(result.roomCode, result.playerId)
      setPlayers([{
        id: result.playerId,
        name,
        avatar,
        tokens: 2,
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
      avatar,
    }, (result) => {
      if (!result.success) { alert(result.error); return }
      setRoom(result.roomCode!, result.playerId!)
      setPlayers([
        ...(result.players ?? []),
        { id: result.playerId!, name, avatar, tokens: 0, isHost: false, turnOrder: 0, timeline: [] },
      ])
    })
  }

  const handleStart = () => {
    socket.emit('game:start', (error) => {
      if (error) alert(error)
    })
  }

  // ── Waiting room (after create/join) ──────────────────────────────────
  if (currentRoomCode) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        {/* Top bar */}
        <div className="px-10 py-5 border-b border-line flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">Room</span>
            <span className="font-mono text-[20px] tracking-[0.18em] text-accent font-semibold">{currentRoomCode}</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-10">
          <div className="w-full max-w-[480px]">
            {/* Players */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">
                Players ({players.length}/6)
              </span>
            </div>

            <div className="flex flex-col gap-2 mb-8">
              {players.map((p) => (
                <div key={p.id} className="flex items-center gap-3.5 px-[18px] py-3.5 rounded-2xl border border-line bg-transparent">
                  {p.avatar
                    ? (
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      />
                    )
                    : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-display text-[20px] flex-shrink-0 overflow-hidden bg-line text-on-bg">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                    )
                  }
                  <span className="flex-1 text-base font-semibold text-on-bg">{p.name}</span>
                  {p.isHost && (
                    <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">host</span>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleStart}
              disabled={players.length < 2}
              className={`w-full h-[60px] rounded-full border-none flex items-center justify-center gap-2.5 font-body font-semibold text-[17px] transition-colors duration-150 ${
                players.length < 2
                  ? 'bg-line text-muted cursor-not-allowed'
                  : 'bg-accent text-accent-ink cursor-pointer'
              }`}
            >
              Cut the deck
              <svg width="16" height="16" viewBox="0 0 14 14">
                <path d="M3 7h8m-3-3 3 3-3 3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {players.length < 2 && (
              <p className="text-center mt-3 font-mono text-[10px] tracking-[0.15em] uppercase text-muted">
                waiting for more players…
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Home / setup ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg grid" style={{ gridTemplateColumns: '1.1fr 1fr' }}>

      {/* ── LEFT: Hero ── */}
      <div className="px-16 py-14 flex flex-col relative overflow-hidden">
        {/* Decorative spinning vinyl in bottom-left */}
        <div
          className="vinyl vinyl-spin"
          style={{
            position: 'absolute', left: -220, bottom: -220,
            width: 480, height: 480, opacity: 0.85,
          }}
        />

        {/* Nav */}
        <div className="relative flex items-center justify-between">
          <Logo />
          <div className="flex gap-7">
            {['How to play', 'Songbook', 'Sign in'].map((l) => (
              <span key={l} className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted cursor-pointer">{l}</span>
            ))}
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative flex-1 flex flex-col justify-center">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-accent">
            Side A · 2–6 players · No app needed
          </div>
          <h1 className="font-display mt-3.5 mb-0 tracking-[-0.02em] text-on-bg" style={{ fontSize: 130, lineHeight: 0.88 }}>
            Name<br />
            <em className="italic text-accent">that</em><br />
            tune.
          </h1>
          <p className="mt-7 text-[17px] leading-[1.55] text-muted max-w-[440px]">
            A music timeline party. Drag mystery hits onto your chronicle.
            First to ten correctly placed cards wins the night.
          </p>
        </div>

        {/* Stats */}
        <div className="relative flex gap-9 font-mono text-[11px] tracking-[0.1em] text-muted">
          {[['200,000+', 'tracks'], ['8', 'decades'], ['∞', 'good times']].map(([n, l]) => (
            <div key={l}>
              <span className="text-accent">{n}</span> {l}
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: Form ── */}
      <div className="px-16 py-14 bg-bg-2 flex flex-col border-l border-line">
        <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">
          Track 01 · Set up the room
        </div>
        <h2 className="font-display text-[48px] mt-2.5 mb-7 leading-none tracking-[-0.02em] text-on-bg">
          Cue up<br />a session.
        </h2>

        {/* Create / Join tabs */}
        <div
          className="flex gap-1 mb-6 p-1 rounded-full self-start"
          style={{ background: 'color-mix(in oklch, var(--color-on-bg) 6%, transparent)' }}
        >
          {(['create', 'join'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full border-none font-mono text-[11px] tracking-[0.15em] uppercase font-bold cursor-pointer transition-colors duration-150 ${
                tab === t ? 'bg-accent text-accent-ink' : 'bg-transparent text-on-bg'
              }`}
            >
              {t === 'create' ? 'Create' : 'Join code'}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {/* Name + avatar */}
          <div className="flex items-center gap-3">
            <ImagePicker
              options={AVATARS}
              value={avatar}
              onChange={setAvatar}
              fallback={name.trim() ? name.trim().charAt(0).toUpperCase() : '?'}
              label="avatar"
            />

            {/* Name input */}
            <div className="flex-1">
              <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">
                Your name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="block w-full mt-2 h-[52px] rounded-[14px] border border-line bg-transparent text-on-bg px-[18px] text-base font-body outline-none box-border focus:border-accent"
              />
            </div>
          </div>

          {/* Join code input */}
          {tab === 'join' && (
            <div>
              <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">
                Room code
              </label>
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="VINYL"
                maxLength={6}
                className="block w-full mt-2 h-[52px] rounded-[14px] border border-line bg-transparent text-accent px-[18px] text-[20px] font-mono tracking-[0.25em] uppercase text-center outline-none box-border focus:border-accent"
              />
            </div>
          )}

          {/* Decade picker (create only) */}
          {tab === 'create' && (
            <div>
              <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">
                Decade
              </label>
              <div className="grid grid-cols-8 gap-1.5 mt-2">
                {DECADES.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDecade(d.value)}
                    className={`h-10 rounded-[10px] font-mono text-[10px] tracking-[0.08em] font-semibold cursor-pointer transition-colors duration-150 ${
                      decade === d.value
                        ? 'bg-accent text-accent-ink border-none'
                        : 'bg-transparent text-on-bg border border-line'
                    }`}
                  >{d.label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Songs to win + Stealing row (create only) */}
          {tab === 'create' && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Songs to win', val: '10', sub: '≈25 min' },
                { label: 'Stealing', val: 'On', sub: '4s window' },
              ].map(({ label, val, sub }) => (
                <div key={label}>
                  <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">{label}</div>
                  <div className="mt-2 px-4 py-3 border border-line rounded-[14px] flex items-center justify-between">
                    <span className="font-display text-[28px] text-accent leading-none">{val}</span>
                    <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted">{sub}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* CTA */}
        <button
          onClick={tab === 'create' ? handleCreate : handleJoin}
          disabled={tab === 'create' ? !name.trim() : !name.trim() || !roomCode.trim()}
          className="mt-7 w-full h-[60px] rounded-full bg-accent text-accent-ink border-none cursor-pointer font-body font-semibold text-[17px] flex items-center justify-center gap-2.5 transition-opacity duration-150 disabled:opacity-40"
        >
          {tab === 'create' ? 'Cut the deck' : 'Join room'}
          <svg width="16" height="16" viewBox="0 0 14 14">
            <path d="M3 7h8m-3-3 3 3-3 3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default LobbyPage
