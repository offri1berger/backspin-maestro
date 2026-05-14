import { useEffect, useRef, useState } from 'react'
import type { Song } from '@backspin-maestro/shared'
import socket from '../../socket'
import LedDisplay from '../boombox/LedDisplay'
import Sticker from '../boombox/Sticker'

interface Props {
  song: Song
  isMyTurn: boolean
  compact?: boolean
}

const Reel = ({ size, spinning }: { size: number; spinning: boolean }) => (
  <div
    style={{
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle at 50% 50%, #1a1414 0 18%, #3a2818 18.5% 70%, #2a1f15 71% 100%)`,
      position: 'relative',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08), 0 4px 12px rgba(0,0,0,.5)',
      animation: spinning ? 'vinyl-rotate 1.2s linear infinite' : undefined,
    }}
  >
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        style={{
          position: 'absolute', left: '50%', top: '50%',
          width: 2, height: size * 0.34,
          background: 'rgba(255,255,255,.18)',
          transform: `translate(-50%, -100%) rotate(${(i / 6) * 360}deg)`,
          transformOrigin: '50% 100%',
        }}
      />
    ))}
    <div
      style={{
        position: 'absolute', left: '50%', top: '50%',
        width: size * 0.18, height: size * 0.18,
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%', background: '#0a0808',
        boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.25)',
      }}
    />
  </div>
)

const PlayBtn = ({
  playing, onClick, size,
}: { playing: boolean; onClick?: () => void; size: number }) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    aria-label={playing ? 'Pause' : 'Play'}
    className="knob-btn"
    style={{
      width: size, height: size,
      background: playing
        ? 'radial-gradient(circle at 30% 25%, var(--color-bad), color-mix(in srgb, var(--color-bad) 50%, #000))'
        : 'radial-gradient(circle at 30% 25%, var(--color-good), color-mix(in srgb, var(--color-good) 50%, #000))',
      boxShadow: `inset 0 -3px 6px rgba(0,0,0,.4), inset 0 2px 4px rgba(255,255,255,.4), 0 4px 0 ${playing ? 'color-mix(in srgb, var(--color-bad) 40%, #000)' : 'color-mix(in srgb, var(--color-good) 40%, #000)'}, 0 0 16px color-mix(in srgb, ${playing ? 'var(--color-bad)' : 'var(--color-good)'} 40%, transparent)`,
      color: playing ? '#fff' : 'var(--color-accent-ink)',
      fontSize: size * 0.4,
      border: 0, cursor: onClick ? 'pointer' : 'default',
    }}
  >
    {playing ? '■' : '▶'}
  </button>
)

const AudioPlayer = ({ song, isMyTurn, compact = false }: Props) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const hasPreview = !!song.previewUrl

  useEffect(() => {
    if (audioRef.current) audioRef.current.load()
  }, [song.id])

  useEffect(() => {
    const onRemotePlay = () => {
      if (!audioRef.current || !song.previewUrl) return
      audioRef.current.play().catch(() => setPlaying(false))
      setPlaying(true)
    }
    const onRemotePause = () => { audioRef.current?.pause(); setPlaying(false) }
    socket.on('audio:play', onRemotePlay)
    socket.on('audio:pause', onRemotePause)
    return () => {
      socket.off('audio:play', onRemotePlay)
      socket.off('audio:pause', onRemotePause)
    }
  }, [song.previewUrl])

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
      socket.emit('audio:pause')
    } else {
      if (!song.previewUrl) return
      audioRef.current.play().catch(() => setPlaying(false))
      setPlaying(true)
      socket.emit('audio:play')
    }
  }

  const onTimeUpdate = () => {
    if (!audioRef.current) return
    const ct = audioRef.current.currentTime
    setCurrentTime(ct)
    setProgress((ct / 30) * 100)
  }

  const fmt = (s: number) => `0:${String(Math.floor(s)).padStart(2, '0')}`

  if (compact) {
    return (
      <div
        className="relative brushed-darker p-3 flex items-center gap-3"
        style={{
          borderRadius: 12,
          border: '2px solid #0a0a0a',
          boxShadow: '0 8px 18px rgba(0,0,0,.5), inset 0 -3px 8px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.05)',
        }}
      >
        <Reel size={44} spinning={playing} />

        {hasPreview && isMyTurn ? (
          <PlayBtn playing={playing} onClick={toggle} size={40} />
        ) : (
          <PlayBtn playing={playing} size={40} />
        )}

        <div className="flex-1 min-w-0">
          <div className="font-display text-[9px] tracking-[0.08em]" style={{ color: 'var(--color-cyan)' }}>
            {!hasPreview
              ? '· NO PREVIEW ·'
              : isMyTurn ? '▸ DROP ON SHELF' : '· WAITING ·'}
          </div>
          <div className="mt-1.5 h-1 rounded-sm relative overflow-hidden" style={{ background: 'rgba(255,255,255,.08)' }}>
            <div
              className="absolute inset-0"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--color-hot), var(--color-accent))',
                boxShadow: '0 0 8px var(--color-hot)',
                transition: 'width 0.5s linear',
              }}
            />
          </div>
          <div
            className="mt-1 flex justify-between font-mono text-[12px] tracking-[0.1em]"
            style={{ color: 'var(--color-muted)' }}
          >
            <span>{fmt(currentTime)}</span>
            <span>0:30</span>
          </div>
        </div>

        <audio
          ref={audioRef}
          src={song.previewUrl}
          onLoadStart={() => { setPlaying(false); setProgress(0); setCurrentTime(0) }}
          onTimeUpdate={onTimeUpdate}
          onEnded={() => { setPlaying(false); socket.emit('audio:pause') }}
        />
      </div>
    )
  }

  return (
    <div
      className="relative brushed-darker flex items-center gap-5"
      style={{
        borderRadius: 16,
        border: '2px solid #0a0a0a',
        padding: '22px 18px 18px',
        marginTop: 12,
        boxShadow: '0 18px 40px rgba(0,0,0,.55), inset 0 -4px 10px rgba(0,0,0,.4), inset 0 2px 0 rgba(255,255,255,.06)',
        minHeight: 140,
      }}
    >
      <Sticker
        color="red"
        rotate={-5}
        size="sm"
        style={{ position: 'absolute', top: -12, left: 18, zIndex: 1 }}
      >
        ● NOW PLAYING
      </Sticker>

      <div className="flex items-center gap-3 shrink-0">
        <Reel size={68} spinning={playing} />
        {hasPreview && isMyTurn ? (
          <PlayBtn playing={playing} onClick={toggle} size={62} />
        ) : (
          <PlayBtn playing={playing} size={62} />
        )}
        <Reel size={68} spinning={playing} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-display text-[10px] tracking-[0.1em]" style={{ color: 'var(--color-cyan)' }}>
          {hasPreview ? `NOW PLAYING · MYSTERY HIT · ${fmt(currentTime)} / 0:30` : 'NO PREVIEW AVAILABLE'}
        </div>
        <h2
          className="font-display mt-1.5 leading-none"
          style={{ fontSize: 34, color: 'var(--color-cream)', textShadow: '3px 3px 0 var(--color-hot), 6px 6px 0 var(--color-accent-ink)' }}
        >
          ?????
        </h2>
        <div className="mt-3 flex items-center gap-3">
          <LedDisplay color="green" style={{ fontSize: 14, padding: '4px 10px' }}>{fmt(currentTime)}</LedDisplay>
          <div className="flex-1 h-1.5 rounded-sm relative overflow-hidden" style={{ background: 'rgba(255,255,255,.08)' }}>
            <div
              className="absolute inset-0"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--color-hot), var(--color-accent))',
                boxShadow: '0 0 10px var(--color-hot)',
                transition: 'width 0.5s linear',
              }}
            />
          </div>
          <LedDisplay color="red" style={{ fontSize: 14, padding: '4px 10px' }}>0:30</LedDisplay>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={song.previewUrl}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => { setPlaying(false); socket.emit('audio:pause') }}
      />
    </div>
  )
}

export default AudioPlayer
