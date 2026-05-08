import { useState } from 'react'
import socket from '../socket'
import { useGameStore } from '../store/gameStore'
import type { Decade } from '@hitster/shared'

const DECADES: { label: string; value: Decade }[] = [
  { label: 'All', value: 'all' },
  { label: '60s', value: '60s' },
  { label: '70s', value: '70s' },
  { label: '80s', value: '80s' },
  { label: '90s', value: '90s' },
  { label: '00s', value: '00s' },
  { label: '10s', value: '10s' },
]
const PLAYER_COLORS = ['#e8a598', '#98c5e8', '#98e8b4', '#e8d598', '#c598e8', '#e898c5']

function Logo() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      fontFamily: 'var(--font-display)', fontSize: 22,
      letterSpacing: '-0.01em',
      color: 'var(--on-bg)',
    }}>
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
  const { setRoom, setPlayers, players, roomCode: currentRoomCode } = useGameStore()

  const handleCreate = () => {
    if (!name.trim()) return
    socket.connect()
    socket.emit('room:create', {
      hostName: name,
      settings: { songsPerPlayer: 10, decadeFilter: decade.toLowerCase() as Decade },
    }, (result) => {
      setRoom(result.roomCode, result.playerId)
      setPlayers([{
        id: result.playerId,
        name,
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
    }, (result) => {
      if (!result.success) { alert(result.error); return }
      setRoom(result.roomCode!, result.playerId!)
      setPlayers([
        ...(result.players ?? []),
        { id: result.playerId!, name, tokens: 0, isHost: false, turnOrder: 0, timeline: [] },
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
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Top bar */}
        <div style={{
          padding: '20px 40px',
          borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Logo />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>Room</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, letterSpacing: '0.18em', color: 'var(--accent)', fontWeight: 600 }}>{currentRoomCode}</span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ width: '100%', maxWidth: 480 }}>
            {/* Players */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Players ({players.length}/6)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
              {players.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px',
                  borderRadius: 16,
                  border: '1px solid var(--line)',
                  background: 'transparent',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: PLAYER_COLORS[i % PLAYER_COLORS.length],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: 20,
                    color: '#1a1612', flexShrink: 0,
                  }}>{p.name.charAt(0).toUpperCase()}</div>
                  <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: 'var(--on-bg)' }}>{p.name}</span>
                  {p.isHost && (
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10,
                      letterSpacing: '0.15em', textTransform: 'uppercase',
                      color: 'var(--muted)',
                    }}>host</span>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleStart}
              disabled={players.length < 2}
              style={{
                width: '100%', height: 60, borderRadius: 999,
                background: players.length < 2 ? 'var(--line)' : 'var(--accent)',
                color: players.length < 2 ? 'var(--muted)' : 'var(--accent-ink)',
                border: 'none', cursor: players.length < 2 ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 17,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'background 0.15s',
              }}
            >
              Cut the deck
              <svg width="16" height="16" viewBox="0 0 14 14">
                <path d="M3 7h8m-3-3 3 3-3 3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {players.length < 2 && (
              <p style={{ textAlign: 'center', marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>
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
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'grid',
      gridTemplateColumns: '1.1fr 1fr',
    }}>

      {/* ── LEFT: Hero ── */}
      <div style={{
        padding: '56px 64px 48px',
        display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative spinning vinyl in bottom-left */}
        <div
          className="vinyl vinyl-spin"
          style={{
            position: 'absolute', left: -220, bottom: -220,
            width: 480, height: 480, opacity: 0.85,
          }}
        />

        {/* Nav */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo />
          <div style={{ display: 'flex', gap: 28 }}>
            {['How to play', 'Songbook', 'Sign in'].map((l) => (
              <span key={l} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', cursor: 'pointer' }}>{l}</span>
            ))}
          </div>
        </div>

        {/* Hero copy */}
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)' }}>
            Side A · 2–6 players · No app needed
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 130, lineHeight: 0.88,
            margin: '14px 0 0',
            letterSpacing: '-0.02em',
            color: 'var(--on-bg)',
          }}>
            Name<br />
            <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>that</em><br />
            tune.
          </h1>
          <p style={{ marginTop: 28, fontSize: 17, lineHeight: 1.55, color: 'var(--muted)', maxWidth: 440 }}>
            A music timeline party. Drag mystery hits onto your chronicle.
            First to ten correctly placed cards wins the night.
          </p>
        </div>

        {/* Stats */}
        <div style={{
          position: 'relative',
          display: 'flex', gap: 36,
          fontFamily: 'var(--font-mono)', fontSize: 11,
          letterSpacing: '0.1em', color: 'var(--muted)',
        }}>
          {[['200,000+', 'tracks'], ['8', 'decades'], ['∞', 'good times']].map(([n, l]) => (
            <div key={l}>
              <span style={{ color: 'var(--accent)' }}>{n}</span> {l}
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: Form ── */}
      <div style={{
        padding: '56px 64px 48px',
        background: 'var(--bg-2)',
        display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid var(--line)',
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Track 01 · Set up the room
        </div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 48, margin: '10px 0 28px', lineHeight: 1,
          letterSpacing: '-0.02em', color: 'var(--on-bg)',
        }}>
          Cue up<br />a session.
        </h2>

        {/* Create / Join tabs */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24,
          padding: 4, borderRadius: 999,
          background: 'color-mix(in oklch, var(--on-bg) 6%, transparent)',
          alignSelf: 'flex-start',
        }}>
          {(['create', 'join'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 20px', borderRadius: 999, border: 'none',
                background: tab === t ? 'var(--accent)' : 'transparent',
                color: tab === t ? 'var(--accent-ink)' : 'var(--on-bg)',
                fontFamily: 'var(--font-mono)', fontSize: 11,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                fontWeight: 700, cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {t === 'create' ? 'Create' : 'Join code'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name */}
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Your name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              style={{
                display: 'block', width: '100%', marginTop: 8,
                height: 52, borderRadius: 14,
                border: '1px solid var(--line)',
                background: 'transparent', color: 'var(--on-bg)',
                padding: '0 18px', fontSize: 16,
                fontFamily: 'var(--font-body)',
                outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--line)'}
            />
          </div>

          {/* Join code input */}
          {tab === 'join' && (
            <div>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Room code
              </label>
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="VINYL"
                maxLength={6}
                style={{
                  display: 'block', width: '100%', marginTop: 8,
                  height: 52, borderRadius: 14,
                  border: '1px solid var(--line)',
                  background: 'transparent', color: 'var(--accent)',
                  padding: '0 18px', fontSize: 20,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.25em', textTransform: 'uppercase',
                  textAlign: 'center', outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--line)'}
              />
            </div>
          )}

          {/* Decade picker (create only) */}
          {tab === 'create' && (
            <div>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Decade
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, marginTop: 8 }}>
                {DECADES.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDecade(d.value)}
                    style={{
                      height: 40, borderRadius: 10,
                      background: decade === d.value ? 'var(--accent)' : 'transparent',
                      color: decade === d.value ? 'var(--accent-ink)' : 'var(--on-bg)',
                      border: decade === d.value ? 'none' : '1px solid var(--line)',
                      fontFamily: 'var(--font-mono)', fontSize: 10,
                      letterSpacing: '0.08em', fontWeight: 600, cursor: 'pointer',
                      transition: 'background 0.12s, color 0.12s',
                    }}
                  >{d.label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Songs to win + Stealing row (create only) */}
          {tab === 'create' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Songs to win', val: '10', sub: '≈25 min' },
                { label: 'Stealing', val: 'On', sub: '4s window' },
              ].map(({ label, val, sub }) => (
                <div key={label}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</div>
                  <div style={{
                    marginTop: 8, padding: '12px 16px',
                    border: '1px solid var(--line)', borderRadius: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--accent)', lineHeight: 1 }}>{val}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>{sub}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* CTA */}
        <button
          onClick={tab === 'create' ? handleCreate : handleJoin}
          disabled={tab === 'create' ? !name.trim() : !name.trim() || !roomCode.trim()}
          style={{
            marginTop: 28,
            width: '100%', height: 60, borderRadius: 999,
            background: 'var(--accent)', color: 'var(--accent-ink)',
            border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 17,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            opacity: (tab === 'create' ? !name.trim() : !name.trim() || !roomCode.trim()) ? 0.4 : 1,
            transition: 'opacity 0.15s',
          }}
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
