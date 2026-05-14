import { useEffect, useRef, useState } from 'react'
import type { Player, DecadeFilter, RoomSettings, UpdateRoomSettingsResult } from '@backspin-maestro/shared'
import { MIN_SONGS_PER_PLAYER, MAX_SONGS_PER_PLAYER } from '@backspin-maestro/shared'
import { useGameStore } from '../../store/gameStore'
import { Logo } from '../ui/Logo'
import MuteToggle from '../ui/MuteToggle'
import { DecadePicker } from './DecadePicker'
import socket from '../../socket'
import Sticker from '../boombox/Sticker'
import LedDisplay from '../boombox/LedDisplay'
import PolaroidAvatar from '../boombox/PolaroidAvatar'
import PlasticButton from '../boombox/PlasticButton'

const POLAROID_ROTATIONS = [-6, 4, -3, 5, -4, 6]

function PlayerPolaroid({
  player,
  index,
  offline,
  canKick,
  isNew,
}: {
  player: Player
  index: number
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

  const rot = POLAROID_ROTATIONS[index % POLAROID_ROTATIONS.length]

  return (
    <div
      className={`relative ${isNew ? 'player-joined-glow' : ''}`}
      style={{ opacity: offline ? 0.4 : 1, transition: 'opacity .15s' }}
    >
      <PolaroidAvatar
        src={player.avatar}
        fallback={player.name.charAt(0)}
        size={86}
        rotate={rot}
        active={isNew}
        name={player.name.toUpperCase()}
      />
      {player.isHost && (
        <Sticker
          color="yellow"
          rotate={index % 2 ? -8 : 8}
          size="sm"
          style={{ position: 'absolute', top: -10, right: -10 }}
        >
          HOST
        </Sticker>
      )}
      {isNew && (
        <Sticker
          color="cyan"
          rotate={-6}
          size="sm"
          style={{ position: 'absolute', bottom: -2, left: -8 }}
        >
          JOINED
        </Sticker>
      )}
      {!isNew && offline && (
        <Sticker
          color="red"
          rotate={3}
          size="sm"
          style={{ position: 'absolute', bottom: 4, left: -8 }}
        >
          OFFLINE
        </Sticker>
      )}
      {canKick && (
        <button
          onClick={handleKick}
          aria-label={`Remove ${player.name}`}
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full cursor-pointer flex items-center justify-center"
          style={{
            background: '#0a0a0a',
            color: 'var(--color-bad)',
            border: '2px solid var(--color-bad)',
            boxShadow: '0 2px 0 #000',
            fontSize: 14, lineHeight: 1, fontWeight: 700,
          }}
        >
          ✕
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
    <div className="relative panel-hardware brushed-dark p-4 lg:p-5 flex flex-col gap-3.5">
      <span className="screw" style={{ top: 6, left: 6 }} />
      <span className="screw" style={{ top: 6, right: 6 }} />
      <span className="screw" style={{ bottom: 6, left: 6 }} />
      <span className="screw" style={{ bottom: 6, right: 6 }} />

      <div className="flex items-center justify-between">
        <Sticker color="yellow" rotate={-3} size="sm">MIX RULES</Sticker>
        <span className="font-display text-[9px] tracking-[0.1em]" style={{ color: 'var(--color-muted)' }}>
          {editable ? 'YOU CONTROL THE DECK' : 'CONDUCTOR CONTROLS'}
        </span>
      </div>

      <DecadePicker
        decadeFilter={settings.decadeFilter}
        onChange={handleDecade}
        disabled={!editable}
      />

      <div>
        <div className="font-display text-[10px] tracking-[0.1em] mb-1.5" style={{ color: 'var(--color-cyan)' }}>
          FIRST TO {settings.songsPerPlayer}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSongs(-1)}
            disabled={!editable || settings.songsPerPlayer <= MIN_SONGS_PER_PLAYER}
            aria-label="Fewer songs"
            className="knob-btn shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              width: 36, height: 36,
              background: 'radial-gradient(circle at 30% 25%, var(--color-bad), color-mix(in srgb, var(--color-bad) 50%, #000))',
              boxShadow: 'inset 0 -3px 6px rgba(0,0,0,.4), inset 0 2px 4px rgba(255,255,255,.4), 0 3px 0 color-mix(in srgb, var(--color-bad) 40%, #000)',
              color: '#fff', fontSize: 16,
            }}
          >−</button>
          <LedDisplay
            color="yellow"
            className="flex-1 text-center"
            style={{ fontSize: 14, padding: '6px 10px' }}
          >
            {settings.songsPerPlayer}·{Math.round(settings.songsPerPlayer * 2.5)}M
          </LedDisplay>
          <button
            type="button"
            onClick={() => handleSongs(1)}
            disabled={!editable || settings.songsPerPlayer >= MAX_SONGS_PER_PLAYER}
            aria-label="More songs"
            className="knob-btn shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              width: 36, height: 36,
              background: 'radial-gradient(circle at 30% 25%, var(--color-good), color-mix(in srgb, var(--color-good) 50%, #000))',
              boxShadow: 'inset 0 -3px 6px rgba(0,0,0,.4), inset 0 2px 4px rgba(255,255,255,.4), 0 3px 0 color-mix(in srgb, var(--color-good) 40%, #000)',
              color: 'var(--color-accent-ink)', fontSize: 16,
            }}
          >+</button>
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

  const emptySlots = Math.max(0, 6 - players.length)

  return (
    <div className="min-h-dvh boombox-bg-soft text-on-bg flex flex-col">
      {/* Top bar */}
      <div className="px-4 sm:px-6 lg:px-10 py-4 border-b-2 border-line bg-surface flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onLeave}
            aria-label="Leave"
            className="font-display text-[10px] tracking-[0.1em] cursor-pointer bg-transparent border-0 p-0 hidden sm:flex items-center gap-1.5"
            style={{ color: 'var(--color-cream)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            EJECT
          </button>
          <Logo />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-bad)', boxShadow: '0 0 10px var(--color-bad)' }} />
            <span className="font-display text-[10px] tracking-[0.1em]" style={{ color: 'var(--color-bad)' }}>REC</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-[#0a0a0a]" />
          <MuteToggle />
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-10 py-5 lg:py-7 flex flex-col gap-4 max-w-[1200px] w-full mx-auto">
        {/* Room code + Settings — stacks on mobile */}
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          {/* Room code card */}
          <div className="relative panel-hardware brushed-dark p-4 lg:p-5 flex flex-col sm:flex-row items-center gap-4">
            <Sticker color="cyan" rotate={-4} size="sm" className="absolute -top-2 left-4">ROOM CODE</Sticker>
            <LedDisplay color="cyan" className="text-center w-full sm:w-auto" style={{ fontSize: 36, letterSpacing: '.3em', padding: '14px 22px' }}>
              {roomCode}
            </LedDisplay>
            <PlasticButton
              onClick={handleCopyCode}
              color="dark"
              className="h-11 px-4 text-[11px] flex items-center gap-2 ml-auto"
              aria-label={copied ? 'Room code copied' : 'Copy room code'}
            >
              <span>⎘ {copied ? 'COPIED!' : 'COPY'}</span>
            </PlasticButton>
          </div>

          {settings ? (
            <SettingsPanel settings={settings} editable={isHost} />
          ) : (
            <div className="relative panel-hardware brushed-dark p-4 lg:p-5 flex items-center justify-center" style={{ minHeight: 120 }}>
              <span className="font-display text-[11px] tracking-[0.1em]" style={{ color: 'var(--color-muted)' }}>
                LOADING SETTINGS…
              </span>
            </div>
          )}
        </div>

        {/* Player polaroid corkboard */}
        <div
          className="relative panel-hardware brushed-darker p-4 lg:p-6"
          style={{ minHeight: 240 }}
        >
          {/* cork pin */}
          <div
            className="absolute top-2.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #ff5050, #a01010)',
              boxShadow: '0 2px 3px rgba(0,0,0,.5), inset 0 -2px 3px rgba(0,0,0,.3)',
            }}
          />
          <Sticker
            color="hot"
            rotate={-3}
            size="sm"
            className="absolute top-4 left-5"
          >
            ★ THE CREW · {players.length}/6
          </Sticker>

          <div className="mt-9 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 justify-items-center items-center">
            {players.map((p, i) => (
              <PlayerPolaroid
                key={p.id}
                player={p}
                index={i}
                offline={disconnectedPlayerIds.includes(p.id)}
                canKick={isHost && p.id !== playerId}
                isNew={recentlyJoined.has(p.id)}
              />
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center justify-center font-display text-[10px] tracking-[0.1em]"
                style={{
                  width: 100, height: 124, padding: 7,
                  background: 'rgba(0,0,0,.3)',
                  border: '2px dashed var(--color-muted)',
                  borderRadius: 4,
                  color: 'var(--color-muted)',
                  transform: `rotate(${i % 2 ? 4 : -4}deg)`,
                }}
              >
                EMPTY SLOT
              </div>
            ))}
          </div>
        </div>

        {/* Start row */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {isHost ? (
            <>
              <PlasticButton
                onClick={onStart}
                disabled={!ready}
                color="green"
                className="flex-1 h-[60px] text-[16px] flex items-center justify-center gap-2"
              >
                ▶ HIT PLAY · START THE SHOW
              </PlasticButton>
              <PlasticButton
                onClick={onLeave}
                color="dark"
                className="h-[60px] px-6 text-[11px]"
              >
                EJECT
              </PlasticButton>
            </>
          ) : (
            <div
              className="flex-1 h-[60px] flex items-center justify-center font-display text-[12px] tracking-[0.1em] rounded-[10px]"
              style={{
                background: '#0a0a0a',
                border: '2px solid var(--color-muted-2)',
                color: 'var(--color-muted)',
              }}
            >
              {ready ? 'WAITING FOR THE CONDUCTOR…' : 'WAITING FOR MORE PLAYERS…'}
            </div>
          )}
        </div>

        {isHost && !ready && (
          <p className="text-center font-display text-[10px] tracking-[0.1em]" style={{ color: 'var(--color-muted)' }}>
            WAITING FOR MORE PLAYERS…
          </p>
        )}
      </div>
    </div>
  )
}
