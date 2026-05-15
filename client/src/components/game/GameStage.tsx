import { useGameStore } from '../../store/gameStore'
import AudioPlayer from './AudioPlayer'
import Timeline from './Timeline'
import { MiniYearCard } from './Timeline'
import Sticker from '../boombox/Sticker'
import PolaroidAvatar from '../boombox/PolaroidAvatar'

interface Props {
  onPlace: (position: number) => void
  onSkip: () => void
  showAudioPlayer?: boolean
  showSkipButton?: boolean
  vertical?: boolean
  pendingPosition?: number | null
  onPendingChange?: (pos: number | null) => void
  showPlaceButton?: boolean
}

export const GameStage = ({
  onPlace,
  onSkip,
  showAudioPlayer = true,
  showSkipButton = true,
  vertical = false,
  pendingPosition,
  onPendingChange,
  showPlaceButton = true,
}: Props) => {
  const { currentSong, currentPlayerId, playerId, players, remoteDragSlot, isWaitingForNextTurn } = useGameStore()

  const isMyTurn = currentPlayerId === playerId
  const activePlayer = players.find((p) => p.id === currentPlayerId)
  const myPlayer = players.find((p) => p.id === playerId)
  const activeTimeline = activePlayer?.timeline ?? []
  const otherPlayers = players.filter((p) => p.id !== currentPlayerId)

  return (
    <main className={`flex flex-col ${vertical ? 'gap-3 px-0 py-0' : 'gap-5 px-6 lg:px-8 py-6 overflow-y-auto'}`}>
      {showAudioPlayer && currentSong && (
        <AudioPlayer key={currentSong.id} song={currentSong} isMyTurn={isMyTurn} />
      )}

      {currentSong && (
        <>
          {vertical ? (
            isMyTurn ? (
              activeTimeline.length > 0 ? (
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span
                    className="font-display text-lg text-cream"
                  >
                    PLACE BETWEEN
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="font-mono px-2 py-1 rounded-md bg-cream text-accent-ink text-[13px] font-bold"
                    >
                      {activeTimeline[0]?.song.year ?? '?'}
                    </span>
                    <span className="text-[var(--color-muted)]">&amp;</span>
                    <span
                      className="font-mono px-2 py-1 rounded-md bg-cream text-accent-ink text-[13px] font-bold"
                    >
                      {activeTimeline[activeTimeline.length - 1]?.song.year ?? '?'}
                    </span>
                  </span>
                </div>
              ) : (
                <h2
                  className="font-display text-[22px] text-cream"
                >
                  PLACE YOUR <span className="text-accent">FIRST CARD</span>
                </h2>
              )
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex w-2 h-2 rounded-full animate-pulse bg-hot [box-shadow:0_0_8px_var(--color-hot)]"
                />
                <span className="text-[13px] text-[var(--color-muted)]">
                  <strong className="text-cream">{activePlayer?.name}</strong> is placing…
                </span>
              </div>
            )
          ) : (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Sticker color="yellow" rotate={-3} size="sm">YOUR SHELF</Sticker>
                {isMyTurn && activeTimeline.length > 0 && (
                  <h2
                    className="font-display text-lg text-cream"
                  >
                    PLACE BETWEEN{' '}
                    <span className="text-accent">{activeTimeline[0]?.song.year ?? '?'}</span>
                    {' '}AND{' '}
                    <span className="text-accent">{activeTimeline[activeTimeline.length - 1]?.song.year ?? '?'}</span>.
                  </h2>
                )}
                {!isMyTurn && (
                  <p className="text-[13px] text-[var(--color-muted)]">
                    Watching <strong className="text-cream">{activePlayer?.name}</strong>'s turn
                  </p>
                )}
              </div>
              <span
                className="font-mono text-sm text-accent tracking-[.1em]"
              >
                {activeTimeline.length}/{myPlayer ? '10' : '10'} SLOTTED
              </span>
            </div>
          )}

          <Timeline
            timeline={activeTimeline}
            currentSong={currentSong}
            onPlace={onPlace}
            isMyTurn={isMyTurn}
            isWaiting={isWaitingForNextTurn}
            spectatorDragSlot={isMyTurn ? null : remoteDragSlot}
            vertical={vertical}
            pendingPosition={pendingPosition}
            onPendingChange={onPendingChange}
            showPlaceButton={showPlaceButton}
          />

          {showSkipButton && isMyTurn && !isWaitingForNextTurn && (myPlayer?.tokens ?? 0) >= 1 && (
            <button
              onClick={onSkip}
              aria-label="Skip this song (costs 1 token)"
              className="self-center plastic-btn plastic-btn-dark h-10 px-5 flex items-center gap-2 text-[11px]"
            >
              SKIP SONG
              <span
                className="px-2 py-0.5 rounded-md text-[10px] text-bad bg-[color-mix(in_srgb,var(--color-bad)_25%,transparent)]"
              >
                −1 ★
              </span>
            </button>
          )}
        </>
      )}

      {!vertical && otherPlayers.length > 0 && (
        <div className="mt-2">
          <Sticker color="cyan" rotate={-3} size="sm">TIMELINES · LIVE</Sticker>
          <div className="mt-3 flex flex-col gap-3">
            {otherPlayers.map((p) => (
              <div
                key={p.id}
                className="rounded-[12px] p-3 brushed-darker border-2 border-[#0a0a0a]"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <PolaroidAvatar
                    src={p.avatar}
                    fallback={p.name.charAt(0)}
                    size={32}
                    rotate={players.indexOf(p) % 2 ? -3 : 3}
                  />
                  <span
                    className="font-display text-[13px] text-cream"
                  >
                    {p.name}
                  </span>
                  <span
                    className="font-mono ml-auto text-sm text-[var(--color-muted)] tracking-[.05em]"
                  >
                    {p.timeline.length} cards · {p.tokens}★
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {p.timeline.length === 0
                    ? (
                      <span
                        className="text-[11px] italic text-[var(--color-muted)]"
                      >
                        Waiting for {p.name}'s first card…
                      </span>
                    )
                    : p.timeline.map((entry, j) => <MiniYearCard key={j} entry={entry} index={j} />)
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
