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
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2 rounded-full border border-line bg-surface text-on-surface"
      style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}
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
