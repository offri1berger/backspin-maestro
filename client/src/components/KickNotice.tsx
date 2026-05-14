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
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[101] px-4 py-2 pop-in"
      style={{
        background: '#1a1a1c',
        color: 'var(--color-cream)',
        border: '2px solid #000',
        borderRadius: 8,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 3px 0 #000',
      }}
    >
      <span
        className="font-display"
        style={{ fontSize: 11, letterSpacing: '.12em' }}
      >
        {notice.message.toUpperCase()}
      </span>
    </div>
  )
}

export default KickNotice
