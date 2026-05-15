import { useGameStore } from '../store/gameStore'

const ConnectionBanner = () => {
  const status = useGameStore((s) => s.connectionStatus)
  if (status === 'connected' || status === 'connecting') return null

  const reconnecting = status === 'reconnecting'
  const label = reconnecting
    ? 'RECONNECTING…'
    : "COULDN'T REJOIN — ROOM EXPIRED. START A NEW MIX."

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 border-b-2 border-[#000] [box-shadow:0_2px_12px_rgba(0,0,0,0.5)] ${reconnecting ? 'bg-[#1a1a1c] text-cream' : 'bg-bad text-white'}`}
    >
      {reconnecting && (
        <span
          className="inline-block w-3 h-3 rounded-full border-2 border-current border-r-transparent animate-spin"
          aria-hidden
        />
      )}
      <span className="font-display text-[11px] tracking-[.14em]">
        {label}
      </span>
    </div>
  )
}

export default ConnectionBanner
