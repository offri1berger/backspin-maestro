import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

const KickNotice = () => {
  const notice = useGameStore((s) => s.kickNotice)
  const setKickNotice = useGameStore((s) => s.setKickNotice)

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setKickNotice(null), 4_000)
    return () => clearTimeout(t)
  }, [notice, setKickNotice])

  if (!notice) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[101] px-4 py-2 rounded-full border border-line bg-surface text-on-surface"
      style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}
    >
      <span className="font-mono text-[11px] tracking-[0.14em] uppercase">{notice.message}</span>
    </div>
  )
}

export default KickNotice
