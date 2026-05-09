import { useGameStore } from '../../store/gameStore'
import { SectionMark, PLAYER_COLORS } from './common'
import AudioPlayer from './AudioPlayer'
import Timeline from './Timeline'
import { MiniYearCard } from './Timeline'

interface Props {
  onPlace: (position: number) => void
  onSkip: () => void
}

export const GameStage = ({ onPlace, onSkip }: Props) => {
  const { currentSong, currentPlayerId, playerId, players, remoteDragSlot, isWaitingForNextTurn } = useGameStore()

  const isMyTurn = currentPlayerId === playerId
  const activePlayer = players.find((p) => p.id === currentPlayerId)
  const myPlayer = players.find((p) => p.id === playerId)
  const activeTimeline = activePlayer?.timeline ?? []
  const otherPlayers = players.filter((p) => p.id !== currentPlayerId)

  return (
    <main className="px-8 py-6 overflow-y-auto flex flex-col gap-[18px]">
      {currentSong && <AudioPlayer song={currentSong} isMyTurn={isMyTurn} />}

      {currentSong && (
        <>
          <div className="flex justify-between items-baseline">
            <div>
              <SectionMark>
                {isMyTurn ? `Your timeline · ${myPlayer?.name}` : `${activePlayer?.name}'s timeline`}
              </SectionMark>
              {isMyTurn && activeTimeline.length > 0 && (
                <h2 className="font-display text-2xl mt-1.5 tracking-[-0.02em] text-on-bg">
                  Place between{' '}
                  <em className="italic text-accent">
                    {activeTimeline[0]?.song.year ?? '?'}
                  </em>
                  {' '}and{' '}
                  <em className="italic text-accent">
                    {activeTimeline[1]?.song.year ?? '?'}
                  </em>.
                </h2>
              )}
              {!isMyTurn && (
                <p className="mt-1.5 text-sm text-muted">
                  Watching <strong className="text-on-bg">{activePlayer?.name}</strong>'s turn
                </p>
              )}
            </div>
            <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">
              drag · or click slot
            </span>
          </div>

          <Timeline
            timeline={activeTimeline}
            currentSong={currentSong}
            onPlace={onPlace}
            isMyTurn={isMyTurn}
            isWaiting={isWaitingForNextTurn}
            spectatorDragSlot={isMyTurn ? null : remoteDragSlot}
          />

          {isMyTurn && !isWaitingForNextTurn && (myPlayer?.tokens ?? 0) >= 1 && (
            <button
              onClick={onSkip}
              className="self-center bg-transparent border border-line rounded-full px-5 py-2 font-mono text-[11px] tracking-[0.12em] uppercase text-muted cursor-pointer"
            >
              Skip · spend 1 ★
            </button>
          )}
        </>
      )}

      {otherPlayers.length > 0 && (
        <div className="mt-2">
          <SectionMark>Timelines · live</SectionMark>
          <div className="mt-3.5 flex flex-col gap-4">
            {otherPlayers.map((p) => (
              <div key={p.id}>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div
                    className="w-6 h-6 rounded-full shrink-0 overflow-hidden flex items-center justify-center font-display text-[13px] text-[#1a1612]"
                    style={{ background: PLAYER_COLORS[players.indexOf(p) % PLAYER_COLORS.length] }}
                  >
                    {p.avatar
                      ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                      : p.name.charAt(0).toUpperCase()
                    }
                  </div>
                  <span className="text-[13px] font-semibold text-on-bg">{p.name}</span>
                  <span className="font-mono text-[9px] tracking-[0.1em] text-muted">
                    {p.timeline.length} cards · {p.tokens}★
                  </span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto">
                  {p.timeline.length === 0
                    ? <span className="text-[11px] text-muted italic">no cards yet</span>
                    : p.timeline.map((entry, j) => <MiniYearCard key={j} entry={entry} />)
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
