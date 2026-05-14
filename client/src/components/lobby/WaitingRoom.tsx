import { useEffect, useRef, useState } from 'react'
import type { Player, DecadeFilter, RoomSettings, UpdateRoomSettingsResult } from '@backspin-maestro/shared'
import { MIN_SONGS_PER_PLAYER, MAX_SONGS_PER_PLAYER } from '@backspin-maestro/shared'
import { useGameStore } from '../../store/gameStore'
import { ArrowIcon, Logo } from '../ui/Logo'
import MuteToggle from '../ui/MuteToggle'
import { DecadePicker } from './DecadePicker'
import socket from '../../socket'

function PlayerRow({
  player,
  offline,
  canKick,
  isNew,
}: {
  player: Player
  offline: boolean
  canKick: boolean
  isNew: boolean
}) {
  const handleKick = () => {
    if (!window.confirm(`Remove ${player.name} from the room?`)) return
    socket.emit('conductor:kick', { playerId: player.id }, (result) => {
      if ('error' in result) console.error('kick error:', result.error)
    })
  }

  return (
    <div
      className={`flex items-center gap-3.5 px-[18px] py-3.5 rounded-2xl border transition-all ${
        offline ? 'opacity-40' : ''
      } ${isNew ? 'border-accent player-joined-glow' : 'border-line'}`}
    >
      {player.avatar
        ? <img src={player.avatar} alt={player.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
        : <div className="w-9 h-9 rounded-full bg-line flex items-center justify-center font-display text-[20px] text-on-bg shrink-0">{player.name.charAt(0).toUpperCase()}</div>
      }
      <span className="flex-1 text-base font-semibold text-on-bg">{player.name}</span>
      {isNew && <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-accent">joined</span>}
      {!isNew && offline && <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">reconnecting…</span>}
      {!isNew && !offline && player.isHost && <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">conductor</span>}
      {canKick && (
        <button
          onClick={handleKick}
          aria-label={`Remove ${player.name}`}
          className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted hover:text-bad transition-colors cursor-pointer bg-transparent border-0 p-0"
        >
          remove
        </button>
      )}
    </div>
  )
}

interface Props {
  roomCode: string
  players: Player[]
  onStart: () => void
  onLeave: () => void
}

const SettingsPanel = ({
  settings,
  editable,
}: {
  settings: RoomSettings
  editable: boolean
}) => {
  const setSettings = useGameStore((s) => s.setSettings)

  const emitChange = (next: RoomSettings) => {
    // Optimistic — broadcast will confirm. On error we log; the next valid
    // broadcast (or page reload) reconciles.
    setSettings(next)
    socket.emit('room:updateSettings', next, (result: UpdateRoomSettingsResult) => {
      if ('error' in result) {
        console.warn('room:updateSettings rejected:', result.error)
      }
    })
  }

  const handleDecade = (decadeFilter: DecadeFilter) => {
    if (!editable) return
    emitChange({ ...settings, decadeFilter })
  }

  const handleSongs = (delta: number) => {
    if (!editable) return
    const next = Math.min(MAX_SONGS_PER_PLAYER, Math.max(MIN_SONGS_PER_PLAYER, settings.songsPerPlayer + delta))
    if (next === settings.songsPerPlayer) return
    emitChange({ ...settings, songsPerPlayer: next })
  }

  return (
    <div className="mb-6 rounded-2xl border border-line p-4 lg:p-5 bg-bg-2/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">Settings</span>
        </div>
        <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-muted">
          {editable ? 'you can edit' : 'conductor controls'}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <DecadePicker
          decadeFilter={settings.decadeFilter}
          onChange={handleDecade}
          disabled={!editable}
        />

        <div>
          <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">Songs to win</label>
          <div className="mt-2 px-2 py-2 border border-line rounded-[14px] flex items-center justify-between bg-bg">
            <button
              type="button"
              onClick={() => handleSongs(-1)}
              disabled={!editable || settings.songsPerPlayer <= MIN_SONGS_PER_PLAYER}
              aria-label="Fewer songs"
              className="w-9 h-9 flex items-center justify-center font-mono text-[20px] text-muted enabled:hover:text-on-bg enabled:cursor-pointer bg-transparent border-none rounded-[8px] enabled:hover:bg-on-bg/5 transition-colors leading-none disabled:opacity-40 disabled:cursor-not-allowed"
            >−</button>
            <div className="flex flex-col items-center">
              <span className="font-display text-[26px] text-accent leading-none">{settings.songsPerPlayer}</span>
              <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-muted mt-0.5">≈{Math.round(settings.songsPerPlayer * 2.5)} min</span>
            </div>
            <button
              type="button"
              onClick={() => handleSongs(1)}
              disabled={!editable || settings.songsPerPlayer >= MAX_SONGS_PER_PLAYER}
              aria-label="More songs"
              className="w-9 h-9 flex items-center justify-center font-mono text-[20px] text-muted enabled:hover:text-on-bg enabled:cursor-pointer bg-transparent border-none rounded-[8px] enabled:hover:bg-on-bg/5 transition-colors leading-none disabled:opacity-40 disabled:cursor-not-allowed"
            >+</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function WaitingRoom({ roomCode, players, onStart, onLeave }: Props) {
  const disconnectedPlayerIds = useGameStore((s) => s.disconnectedPlayerIds)
  const playerId = useGameStore((s) => s.playerId)
  const settings = useGameStore((s) => s.settings)
  const isHost = players.find((p) => p.id === playerId)?.isHost ?? false

  // Highlight rows of players who joined since this client mounted.
  // Local-mounted players (including yourself) are seeded into `seenIds` on
  // first render so they don't flash on initial paint.
  const seenIdsRef = useRef<Set<string>>(new Set(players.map((p) => p.id)))
  const [recentlyJoined, setRecentlyJoined] = useState<Set<string>>(new Set())

  useEffect(() => {
    const newcomers = players.filter((p) => !seenIdsRef.current.has(p.id))
    if (newcomers.length === 0) return
    newcomers.forEach((p) => seenIdsRef.current.add(p.id))
    setRecentlyJoined((prev) => {
      const next = new Set(prev)
      newcomers.forEach((p) => next.add(p.id))
      return next
    })
    const timers = newcomers.map((p) =>
      setTimeout(() => {
        setRecentlyJoined((prev) => {
          if (!prev.has(p.id)) return prev
          const next = new Set(prev)
          next.delete(p.id)
          return next
        })
      }, 2500),
    )
    return () => { timers.forEach(clearTimeout) }
  }, [players])
  const ready = players.length >= 2
  const [copied, setCopied] = useState(false)

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard API can fail in non-secure contexts; silently ignore
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="px-5 lg:px-10 py-5 border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onLeave}
            className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.15em] uppercase text-muted hover:text-on-bg transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Leave
          </button>
          <div className="w-px h-4 bg-line" />
          <Logo />
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted hidden sm:inline">Room</span>
          <button
            onClick={handleCopyCode}
            aria-label={copied ? 'Room code copied' : 'Copy room code'}
            className="group flex items-center gap-2 bg-transparent border-none p-0 cursor-pointer"
          >
            <span className="font-mono text-[20px] tracking-[0.18em] text-accent font-semibold group-hover:opacity-80 transition-opacity">{roomCode}</span>
            <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted group-hover:text-on-bg transition-colors">
              {copied ? 'copied!' : 'copy'}
            </span>
          </button>
          <div className="w-px h-4 bg-line" />
          <MuteToggle />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-5 lg:p-10">
        <div className="w-full max-w-[480px]">
          {settings && <SettingsPanel settings={settings} editable={isHost} />}

          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">
              Players ({players.length}/6)
            </span>
          </div>

          <div className="flex flex-col gap-2 mb-8">
            {players.map((p) => (
              <PlayerRow
                key={p.id}
                player={p}
                offline={disconnectedPlayerIds.includes(p.id)}
                canKick={isHost && p.id !== playerId}
                isNew={recentlyJoined.has(p.id)}
              />
            ))}
            {Array.from({ length: Math.max(0, 6 - players.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-3.5 px-[18px] py-3.5 rounded-2xl border border-dashed border-line opacity-50"
              >
                <div className="w-9 h-9 rounded-full border border-dashed border-line shrink-0" />
                <span className="flex-1 font-mono text-[11px] tracking-[0.15em] uppercase text-muted">
                  waiting for player…
                </span>
              </div>
            ))}
          </div>

          {isHost ? (
            <>
              <button
                onClick={onStart}
                disabled={!ready}
                className={`w-full h-[60px] rounded-full border-none flex items-center justify-center gap-2.5 font-body font-semibold text-[17px] transition-colors duration-150 ${
                  ready
                    ? 'bg-accent text-accent-ink cursor-pointer'
                    : 'bg-line text-muted cursor-not-allowed'
                }`}
              >
                Cut the deck
                <ArrowIcon />
              </button>
              {!ready && (
                <p className="text-center mt-3 font-mono text-[10px] tracking-[0.15em] uppercase text-muted">
                  waiting for more players…
                </p>
              )}
            </>
          ) : (
            <p className="text-center font-mono text-[10px] tracking-[0.15em] uppercase text-muted">
              {ready ? 'waiting for the conductor to start…' : 'waiting for more players…'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
