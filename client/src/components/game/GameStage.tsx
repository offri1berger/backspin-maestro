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
    <main style={{ padding: '24px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {currentSong && <AudioPlayer song={currentSong} isMyTurn={isMyTurn} />}

      {currentSong && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <SectionMark>
                {isMyTurn ? `Your timeline · ${myPlayer?.name}` : `${activePlayer?.name}'s timeline`}
              </SectionMark>
              {isMyTurn && activeTimeline.length > 0 && (
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, margin: '6px 0 0', letterSpacing: '-0.02em', color: 'var(--on-bg)' }}>
                  Place between{' '}
                  <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                    {activeTimeline[0]?.song.year ?? '?'}
                  </em>
                  {' '}and{' '}
                  <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                    {activeTimeline[1]?.song.year ?? '?'}
                  </em>.
                </h2>
              )}
              {!isMyTurn && (
                <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--muted)' }}>
                  Watching <strong style={{ color: 'var(--on-bg)' }}>{activePlayer?.name}</strong>'s turn
                </p>
              )}
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>
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
              style={{
                alignSelf: 'center', background: 'none', border: '1px solid var(--line)',
                borderRadius: 999, padding: '8px 20px',
                fontFamily: 'var(--font-mono)', fontSize: 11,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--muted)', cursor: 'pointer',
              }}
            >
              Skip · spend 1 ★
            </button>
          )}
        </>
      )}

      {otherPlayers.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <SectionMark>Timelines · live</SectionMark>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {otherPlayers.map((p) => (
              <div key={p.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: PLAYER_COLORS[players.indexOf(p) % PLAYER_COLORS.length],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: 13, color: '#1a1612',
                  }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-bg)' }}>{p.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--muted)' }}>
                    {p.timeline.length} cards · {p.tokens}★
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                  {p.timeline.length === 0
                    ? <span style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>no cards yet</span>
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
