import { useGameStore } from '../../store/gameStore'

const MobilePlayerBar: React.FC = () => {
  const { players, currentPlayerId, disconnectedPlayerIds } = useGameStore()

  return (
    <div className="flex gap-2 px-3 py-2.5 border-b border-line bg-bg shrink-0">
      {players.map((p) => {
        const active = p.id === currentPlayerId
        const offline = disconnectedPlayerIds.includes(p.id)
        return (
          <div
            key={p.id}
            className={`flex-1 min-w-0 rounded-[14px] px-2 pt-[10px] pb-2 text-center transition-opacity ${
              offline ? 'opacity-40' : ''
            } ${active ? 'bg-accent text-accent-ink' : 'text-on-bg border border-line'}`}
          >
            <div className="text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
              {p.name}
            </div>
            <div className="font-mono text-[10px] tracking-[0.08em] mt-0.5 opacity-80">
              {p.timeline.length}/10 · {p.tokens}★
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default MobilePlayerBar
