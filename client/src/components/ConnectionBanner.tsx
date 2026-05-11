import { useGameStore } from '../store/gameStore'

const ConnectionBanner = () => {
  const status = useGameStore((s) => s.connectionStatus)
  if (status === 'connected' || status === 'connecting') return null

  const reconnecting = status === 'reconnecting'
  const label = reconnecting
    ? 'Reconnecting…'
    : "Couldn't rejoin — the room expired. Start a new game."

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-1.5 text-on-surface ${
        reconnecting ? 'bg-surface' : 'bg-bad text-white'
      }`}
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}
    >
      {reconnecting && (
        <span
          className="inline-block w-3 h-3 rounded-full border-2 border-accent border-r-transparent animate-spin"
          aria-hidden
        />
      )}
      <span className="font-mono text-[11px] tracking-[0.14em] uppercase">{label}</span>
    </div>
  )
}

export default ConnectionBanner
