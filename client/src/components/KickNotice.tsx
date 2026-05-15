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
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[101] px-4 py-2 pop-in bg-[#1a1a1c] text-cream border-2 border-[#000] rounded-lg [box-shadow:0_10px_30px_rgba(0,0,0,0.5),_0_3px_0_#000]"
    >
      <span className="font-display text-[11px] tracking-[.12em]">
        {notice.message.toUpperCase()}
      </span>
    </div>
  )
}

export default KickNotice
