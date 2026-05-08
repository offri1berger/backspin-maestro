import { useEffect, useRef, useState } from 'react'
import type { Song } from '@hitster/shared'
import socket from '../../socket'

interface Props {
  song: Song
  isMyTurn: boolean
}

const AudioPlayer = ({ song, isMyTurn }: Props) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setPlaying(false)
    setProgress(0)
    if (audioRef.current) audioRef.current.load()
  }, [song.id])

  useEffect(() => {
    socket.on('audio:play', () => {
      audioRef.current?.play()
      setPlaying(true)
    })

    socket.on('audio:pause', () => {
      audioRef.current?.pause()
      setPlaying(false)
    })

    return () => {
      socket.off('audio:play')
      socket.off('audio:pause')
    }
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
    setProgress((audioRef.current.currentTime / 30) * 100)
  }

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {isMyTurn ? (
          <button
            onClick={toggle}
            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center text-xl hover:bg-zinc-200 transition"
          >
            {playing ? '⏸' : '▶'}
          </button>
        ) : (
          <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-xl">
            {playing ? '🔊' : '🔇'}
          </div>
        )}
        <div>
          <p className="font-semibold">mystery song</p>
          <p className="text-zinc-400 text-sm">
            {isMyTurn ? 'you control the music' : 'waiting for active player'}
          </p>
        </div>
      </div>

      <div className="w-full bg-zinc-700 rounded-full h-1.5">
        <div
          className="bg-white h-1.5 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
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