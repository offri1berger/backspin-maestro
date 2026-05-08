import { useEffect, useRef, useState } from 'react'
import type { Song } from '@hitster/shared'
import socket from '../../socket'

interface Props {
  song: Song
  isMyTurn: boolean
}

function WaveIcon() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 20 }}>
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

const AudioPlayer = ({ song, isMyTurn }: Props) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    setPlaying(false)
    setProgress(0)
    setCurrentTime(0)
    if (audioRef.current) audioRef.current.load()
  }, [song.id])

  useEffect(() => {
    socket.on('audio:play', () => { audioRef.current?.play(); setPlaying(true) })
    socket.on('audio:pause', () => { audioRef.current?.pause(); setPlaying(false) })
    return () => { socket.off('audio:play'); socket.off('audio:pause') }
  }, [])

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
      socket.emit('audio:pause')
    } else {
      audioRef.current.play()
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

  return (
    <div style={{
      background: 'var(--surface)',
      color: 'var(--on-surface)',
      borderRadius: 28,
      padding: '28px 32px',
      display: 'flex',
      alignItems: 'center',
      gap: 28,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Spinning vinyl */}
      <div style={{ width: 140, height: 140, flexShrink: 0, position: 'relative' }}>
        <div
          className={`vinyl${playing ? ' vinyl-spin' : ''}`}
          style={{ width: '100%', height: '100%' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isMyTurn ? (
            <button
              onClick={toggle}
              style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'var(--accent)', color: 'var(--accent-ink)',
                border: '4px solid var(--surface)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
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
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {playing
                ? <WaveIcon />
                : <svg width="15" height="17" viewBox="0 0 16 18" style={{ opacity: 0.35 }}><path d="M2 1l13 8-13 8z" fill="currentColor" /></svg>
              }
            </div>
          )}
        </div>
      </div>

      {/* Track meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--accent)',
        }}>
          Now playing · {fmt(currentTime)} / 0:30
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 44, margin: '6px 0 0', lineHeight: 0.95,
          letterSpacing: '-0.02em',
          color: 'var(--on-surface)',
        }}>
          Mystery hit
          <br />
          <em style={{ fontStyle: 'italic', color: 'var(--accent)', opacity: 0.85, fontSize: 30 }}>
            {isMyTurn ? 'drop it on your timeline' : 'waiting…'}
          </em>
        </h2>

        {/* Progress bar */}
        <div style={{
          marginTop: 18, height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.12)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            width: `${progress}%`,
            background: 'var(--accent)',
            transition: 'width 0.5s linear',
          }} />
        </div>
        <div style={{
          marginTop: 8, display: 'flex', justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)',
        }}>
          <span>{fmt(currentTime)}</span>
          <span>0:30</span>
        </div>
      </div>

      {/* Corner label */}
      <div style={{
        position: 'absolute', top: 16, right: 20,
        fontFamily: 'var(--font-mono)', fontSize: 10,
        letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)',
      }}>33⅓ RPM</div>

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
