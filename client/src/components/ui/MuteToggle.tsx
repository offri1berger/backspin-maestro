import { useGameStore } from '../../store/gameStore'

interface Props {
  className?: string
}

const MuteToggle = ({ className = '' }: Props) => {
  const muted = useGameStore((s) => s.muted)
  const setMuted = useGameStore((s) => s.setMuted)

  return (
    <button
      type="button"
      onClick={() => setMuted(!muted)}
      aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
      aria-pressed={muted}
      className={`w-7 h-7 flex items-center justify-center bg-transparent border-none cursor-pointer text-muted hover:text-on-bg transition-colors ${className}`}
    >
      {muted ? (
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <path d="M3 6.5h2.5L9 3v12L5.5 11.5H3v-5z" fill="currentColor" />
          <path d="M12 6.5l4 5M16 6.5l-4 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <path d="M3 6.5h2.5L9 3v12L5.5 11.5H3v-5z" fill="currentColor" />
          <path d="M12 5.5c1.5 1 1.5 6 0 7M13.5 4c2.2 1.5 2.2 8.5 0 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </svg>
      )}
    </button>
  )
}

export default MuteToggle
