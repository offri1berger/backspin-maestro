import { useGameStore } from '../../store/gameStore'
import { SectionMark, PLAYER_COLORS } from './common'

export const PlayerRail = () => {
  const { players, currentPlayerId, playerId, disconnectedPlayerIds } = useGameStore()

  return (
    <aside className="p-5 border-r border-line overflow-y-auto bg-bg">
      <SectionMark>Crowd</SectionMark>

      <div className="mt-3 flex flex-col gap-2">
        {players.map((p, i) => {
          const active = p.id === currentPlayerId
          const isMe = p.id === playerId
          const offline = disconnectedPlayerIds.includes(p.id)
          return (
            <div
              key={p.id}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[14px] transition-opacity ${
                offline ? 'opacity-40' : ''
              } ${
                active
                  ? 'bg-accent text-accent-ink border-0'
                  : 'bg-transparent text-on-bg border border-line'
              }`}
            >
              <div
                className="w-[34px] h-[34px] rounded-full shrink-0 overflow-hidden flex items-center justify-center font-display text-lg text-[#1a1612]"
                style={{ background: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
              >
                {p.avatar
                  ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                  : p.name.charAt(0).toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold">
                  {p.name}{isMe ? ' (you)' : ''}
                </div>
                <div className={`font-mono text-[9px] tracking-[0.1em] mt-0.5 ${active ? 'opacity-80' : 'opacity-60'}`}>
                  {p.timeline.length}/10 cards · {p.tokens}★
                </div>
              </div>
              {active && (
                <span className="font-mono text-[9px] tracking-[0.15em] uppercase font-bold">
                  now
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-7">
        <SectionMark>Shortcuts</SectionMark>
        <div className="mt-3 flex flex-col gap-2">
          {([['SPACE', 'Play / pause'], ['← →', 'Move card'], ['↵', 'Lock placement'], ['G', 'Guess input']] as const).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2.5">
              <kbd
                className="font-mono text-[10px] px-[7px] py-[3px] rounded-md border border-line text-on-bg min-w-[34px] text-center"
                style={{ background: 'color-mix(in oklch, var(--color-on-bg) 4%, transparent)' }}
              >{k}</kbd>
              <span className="text-[11px] text-muted">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
