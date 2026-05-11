import { useEffect, useRef, useState } from 'react'
import type { Song } from '@hitster/shared'
import socket from '../../socket'

interface Props {
  song: Song
  isMyTurn: boolean
  compact?: boolean
}

function WaveIcon() {
  return (
    <div className="flex items-center h-5" style={{ gap: 2 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="wave-bar"
          style={{ animationDelay: `${i * 0.12}s`, height: '100%' }}
        />
      ))}
    </div>
  )
}

const AudioPlayer = ({ song, isMyTurn, compact = false }: Props) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const hasPreview = !!song.previewUrl

  // Reset playback state via the audio element's own loadstart event (not synchronously in effect)
  useEffect(() => {
    if (audioRef.current) audioRef.current.load()
  }, [song.id])

  useEffect(() => {
    socket.on('audio:play', () => {
      if (!audioRef.current || !song.previewUrl) return
      audioRef.current.play().catch(() => setPlaying(false))
      setPlaying(true)
    })
    socket.on('audio:pause', () => { audioRef.current?.pause(); setPlaying(false) })
    return () => { socket.off('audio:play'); socket.off('audio:pause') }
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
      <div className="flex items-center gap-3 bg-surface text-on-surface rounded-[16px] p-3 relative overflow-hidden">
        {/* Small vinyl + play button */}
        <div className="w-[52px] h-[52px] shrink-0 relative">
          <div
            className={`vinyl${playing ? ' vinyl-spin' : ''}`}
            style={{ width: '100%', height: '100%' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            {!hasPreview ? (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                aria-label="No audio preview available"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" style={{ opacity: 0.4 }}>
                  <path d="M2 2l12 12M2 14L14 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
            ) : isMyTurn ? (
              <button
                onClick={toggle}
                className="w-8 h-8 rounded-full bg-accent text-accent-ink cursor-pointer flex items-center justify-center"
                style={{ border: '3px solid var(--color-surface)' }}
              >
                {playing
                  ? <WaveIcon />
                  : <svg width="10" height="12" viewBox="0 0 16 18"><path d="M2 1l13 8-13 8z" fill="currentColor" /></svg>
                }
              </button>
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                {playing
                  ? <WaveIcon />
                  : <svg width="10" height="12" viewBox="0 0 16 18" style={{ opacity: 0.35 }}><path d="M2 1l13 8-13 8z" fill="currentColor" /></svg>
                }
              </div>
            )}
          </div>
        </div>

        {/* Track info + progress */}
        <div className="flex-1 min-w-0">
          <div className="font-mono tracking-[0.15em] uppercase text-accent" style={{ fontSize: 9 }}>
            {!hasPreview
              ? 'No preview available'
              : `${isMyTurn ? 'Drop it on your timeline' : 'Waiting…'} · ${fmt(currentTime)} / 0:30`}
          </div>
          <div
            className="mt-2 h-1 rounded-sm relative overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            <div
              className="absolute inset-0 bg-accent"
              style={{ width: `${progress}%`, transition: 'width 0.5s linear' }}
            />
          </div>
          <div
            className="mt-1.5 flex justify-between font-mono tracking-[0.1em] uppercase"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}
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
    <div className="bg-surface text-on-surface rounded-[28px] p-7 flex items-center gap-7 relative overflow-hidden h-[160px]">
      {/* Spinning vinyl */}
      <div className="w-[140px] h-[140px] shrink-0 relative">
        <div
          className={`vinyl${playing ? ' vinyl-spin' : ''}`}
          style={{ width: '100%', height: '100%' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          {!hasPreview ? (
            <div
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center"
              aria-label="No audio preview available"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" style={{ opacity: 0.4 }}>
                <path d="M2 2l12 12M2 14L14 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
          ) : isMyTurn ? (
            <button
              onClick={toggle}
              className="w-[52px] h-[52px] rounded-full bg-accent text-accent-ink cursor-pointer flex items-center justify-center"
              style={{ border: '4px solid var(--color-surface)' }}
            >
              {playing ? (
                <WaveIcon />
              ) : (
                <svg width="15" height="17" viewBox="0 0 16 18">
                  <path d="M2 1l13 8-13 8z" fill="currentColor" />
                </svg>
              )}
            </button>
          ) : (
            <div
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              {playing
                ? <WaveIcon />
                : <svg width="15" height="17" viewBox="0 0 16 18" style={{ opacity: 0.35 }}><path d="M2 1l13 8-13 8z" fill="currentColor" /></svg>
              }
            </div>
          )}
        </div>
      </div>

      {/* Track meta */}
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[8px] tracking-[0.2em] uppercase text-accent">
          {hasPreview ? `Now playing · ${fmt(currentTime)} / 0:30` : 'No preview available'}
        </div>

        <h2 className="font-display text-[34px] mt-1.5 leading-[0.95] tracking-[-0.02em] text-on-surface" style={{ margin: '6px 0 0' }}>
          Mystery hit
          <br />
          <em className="not-italic text-accent" style={{ opacity: 0.85, fontSize: 30 }}>
            {!hasPreview ? 'use the year hints' : isMyTurn ? 'drop it on your timeline' : 'waiting…'}
          </em>
        </h2>

        {/* Progress bar */}
        <div
          className="mt-[18px] h-1 rounded-sm relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.12)' }}
        >
          <div
            className="absolute inset-0 bg-accent"
            style={{ width: `${progress}%`, transition: 'width 0.5s linear' }}
          />
        </div>
        <div
          className="mt-2 flex justify-between font-mono text-[10px] tracking-[0.12em] uppercase"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <span>{fmt(currentTime)}</span>
          <span>0:30</span>
        </div>
      </div>

      {/* Corner label */}
      <div
        className="absolute top-4 right-5 font-mono text-[10px] tracking-[0.2em]"
        style={{ color: 'rgba(255,255,255,0.35)' }}
      >
        33⅓ RPM
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
