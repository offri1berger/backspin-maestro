import { useEffect, useRef, useState } from 'react'
import type { Song } from '@hitster/shared'

interface Props {
  song: Song
}

const AudioPlayer = ({ song }: Props) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setPlaying(false)
    setProgress(0)
    if (audioRef.current) {
      audioRef.current.load()
    }
  }, [song.id])

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }

  const onTimeUpdate = () => {
    if (!audioRef.current) return
    setProgress((audioRef.current.currentTime / 30) * 100)
  }

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center text-xl hover:bg-zinc-200 transition"
        >
          {playing ? '⏸' : '▶'}
        </button>
        <div>
          <p className="font-semibold">mystery song</p>
          <p className="text-zinc-400 text-sm">guess the year</p>
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
        onEnded={() => setPlaying(false)}
      />
    </div>
  )
}

export default AudioPlayer