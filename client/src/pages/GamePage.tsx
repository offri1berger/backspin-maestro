import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import AudioPlayer from '../components/game/AudioPlayer'
import Timeline from '../components/game/Timeline'
import { MiniYearCard } from '../components/game/Timeline'
import socket from '../socket'

const PLAYER_COLORS = ['#e8a598', '#98c5e8', '#98e8b4', '#e8d598', '#c598e8', '#e898c5']

const Logo = () => { 
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-display)', fontSize: 20 }}>
      <div className="vinyl" style={{ width: 22, height: 22, flexShrink: 0 }} />
      <span style={{ color: 'var(--on-bg)' }}>Hitster</span>
    </div>
  )
}

const SectionMark = ({ children }: { children: React.ReactNode }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, display: 'inline-block' }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>{children}</span>
    </div>
  )
}

const GamePage = () => {
  const {
    currentSong,
    players,
    currentPlayerId,
    playerId,
    placementResult,
    isWaitingForNextTurn,
    remoteDragSlot,
    stealResult,
    isStealWindowOpen,
    stealInitiatorId,
    setHasGuessed,
    setRemoteDragSlot,
  } = useGameStore()

  const isMyTurn = currentPlayerId === playerId
  const activePlayer = players.find((p) => p.id === currentPlayerId)
  const myPlayer = players.find((p) => p.id === playerId)
  const activeTimeline = activePlayer?.timeline ?? []

  const [guess, setGuess] = useState({ artist: '', title: '' })
  const [isAttemptingSteal, setIsAttemptingSteal] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [stealWindowSeconds, setStealWindowSeconds] = useState(5)

  useEffect(() => {
    socket.on('drag:update', (slot) => setRemoteDragSlot(slot))
    return () => { socket.off('drag:update') }
  }, [setRemoteDragSlot])

  // when someone initiates a steal, extend the countdown to 10s
  useEffect(() => {
    if (stealInitiatorId) setStealWindowSeconds(10)
  }, [stealInitiatorId])

  useEffect(() => { setRemoteDragSlot(null) }, [currentPlayerId, setRemoteDragSlot])
  // close steal overlay when steal window closes (timeout fired or steal resolved)
  useEffect(() => { if (!isStealWindowOpen) setIsAttemptingSteal(false) }, [isStealWindowOpen])

  useEffect(() => {
    if (!isStealWindowOpen) { setCountdown(0); setStealWindowSeconds(5); return }
    setCountdown(stealWindowSeconds)
    const iv = setInterval(() => setCountdown((c) => (c <= 1 ? (clearInterval(iv), 0) : c - 1)), 1000)
    return () => clearInterval(iv)
  }, [isStealWindowOpen, stealWindowSeconds])

  const handlePlace = (position: number) => {
    if (guess.artist.trim() && guess.title.trim()) {
      socket.emit('song:guess', { artist: guess.artist, title: guess.title })
    }
    socket.emit('card:place', { position }, (error: unknown) => {
      if (error) console.error('place error:', error)
    })
    setGuess({ artist: '', title: '' })
    setHasGuessed(true)
  }

  const handleSkip = () => {
    socket.emit('song:skip', (error) => { if (error) console.error('skip error:', error) })
  }

  const handleStealAttempt = (position: number) => {
    if (!currentPlayerId) return
    socket.emit('steal:attempt', { targetPlayerId: currentPlayerId, position }, (error) => {
      if (error) console.error('steal error:', error)
    })
    setIsAttemptingSteal(false)
  }

  const canSteal = !isMyTurn && isStealWindowOpen && stealResult === null && (myPlayer?.tokens ?? 0) >= 1

  // ── Steal overlay (modal) ─────────────────────────────────────────────
if (isAttemptingSteal && currentSong) {
  const isDanger = countdown <= 3

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          background: 'var(--bg)',
          borderRadius: 32,
          padding: 36,
          border: '1px solid var(--line)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.45)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: isDanger
              ? 'radial-gradient(circle at top, rgba(255,80,80,0.12), transparent 55%)'
              : 'radial-gradient(circle at top, rgba(255,255,255,0.06), transparent 55%)',
            pointerEvents: 'none',
          }}
        />

        {/* top row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 24,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: 8,
              }}
            >
              Steal attempt
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 38,
                lineHeight: 1,
                letterSpacing: '-0.03em',
                margin: 0,
                color: 'var(--on-bg)',
              }}
            >
              Steal the card
            </h2>
          </div>

          <button
            onClick={() => setIsAttemptingSteal(false)}
            style={{
              background: 'transparent',
              border: '1px solid var(--line)',
              borderRadius: 999,
              height: 36,
              padding: '0 14px',
              cursor: 'pointer',
              color: 'var(--muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            ESC
          </button>
        </div>

        {/* countdown */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 28,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: `6px solid ${
                isDanger ? 'var(--bad)' : 'var(--accent)'
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                'color-mix(in oklch, var(--surface) 80%, transparent)',
              boxShadow: isDanger
                ? '0 0 40px rgba(255,80,80,0.35)'
                : '0 0 40px rgba(255,255,255,0.06)',
              transform: isDanger ? 'scale(1.04)' : 'scale(1)',
              transition: 'all 0.2s ease',
              animation: isDanger ? 'pulse 0.9s infinite' : 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                lineHeight: 1,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 52,
                  color: isDanger
                    ? 'var(--bad)'
                    : 'var(--accent)',
                }}
              >
                {countdown}
              </span>

              <span
                style={{
                  marginTop: 4,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                seconds
              </span>
            </div>
          </div>
        </div>

        {/* description */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 28,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <p
            style={{
              color: 'var(--muted)',
              fontSize: 15,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Place the song correctly in{' '}
            <strong style={{ color: 'var(--on-bg)' }}>
              {activePlayer?.name}
            </strong>
            's timeline.
          </p>

          <div
            style={{
              marginTop: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 999,
              background:
                'color-mix(in oklch, var(--on-bg) 5%, transparent)',
              border: '1px solid var(--line)',
            }}
          >
            <span
              style={{
                fontSize: 14,
              }}
            >
              ★
            </span>

            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
              }}
            >
              Costs 1 token
            </span>
          </div>
        </div>

        {/* timeline */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Timeline
            timeline={activeTimeline}
            currentSong={currentSong}
            onPlace={handleStealAttempt}
            isMyTurn
            isWaiting={false}
            broadcastDrag={false}
            autoConfirm
          />
        </div>

        {/* pulse animation */}
        <style>
          {`
            @keyframes pulse {
              0% {
                transform: scale(1);
              }
              50% {
                transform: scale(1.06);
              }
              100% {
                transform: scale(1);
              }
            }
          `}
        </style>
      </div>
    </div>
  )
}

  // ── Placement/steal result toast ──────────────────────────────────────
  const renderToast = () => {
    // steal result takes priority — placement:result also fires alongside it but is secondary
    if (stealResult) {
      const stealerName = players.find((p) => p.id === stealResult.stealerId)?.name ?? 'Someone'
      const targetName = players.find((p) => p.id === stealResult.targetPlayerId)?.name ?? 'them'
      const iAmStealer = stealResult.stealerId === playerId
      const iAmTarget = stealResult.targetPlayerId === playerId
      const success = stealResult.correct
      // green/red is from THIS viewer's perspective, not the steal outcome globally
      const isGoodForMe = iAmStealer ? success : iAmTarget ? stealResult.targetWasCorrect : success

      let headline = ''
      let subline = ''
      if (success) {
        headline = iAmStealer ? 'You stole it!' : iAmTarget ? `${stealerName} stole your card!` : `${stealerName} stole the card!`
        subline = iAmStealer ? 'Card added to your timeline.' : iAmTarget ? 'Your card goes to their timeline.' : ''
      } else if (stealResult.targetWasCorrect) {
        headline = iAmStealer ? 'Steal failed — they placed correctly' : iAmTarget ? `${stealerName} tried to steal but failed!` : `${stealerName}'s steal failed`
        subline = iAmStealer ? `${targetName} was right all along. You lost 1 ★.` : iAmTarget ? `${stealerName} placed it wrong — your card is safe.` : `${targetName} placed correctly — nothing was stolen.`
      } else {
        headline = iAmStealer ? 'Steal failed — wrong position' : iAmTarget ? `${stealerName} tried to steal but missed!` : `${stealerName}'s steal failed`
        subline = iAmStealer ? 'Your position was incorrect. You lost 1 ★.' : iAmTarget ? 'Wrong position — your card stays.' : 'Wrong position — steal attempt missed.'
      }

      return (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.55)',
          pointerEvents: 'none',
        }}>
          <div style={{ minWidth: 320, maxWidth: 420, borderRadius: 24, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>
            <div style={{ background: isGoodForMe ? 'var(--good)' : 'var(--bad)', padding: '20px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{isGoodForMe ? '🎉' : '😬'}</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#fff', lineHeight: 1.3 }}>{headline}</div>
              {subline && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>{subline}</div>}
            </div>
            <div style={{ background: 'var(--surface)', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--on-surface)' }}>{stealResult.song.title}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{stealResult.song.artist}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--accent)', lineHeight: 1 }}>{stealResult.song.year}</div>
            </div>
          </div>
        </div>
      )
    }

    if (placementResult?.correct) {
      return (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 40, padding: '12px 24px', borderRadius: 999,
          background: 'var(--good)', color: '#fff',
          fontWeight: 700, fontSize: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>
          {placementResult.message ?? '✓ Correct!'}
        </div>
      )
    }

    if (placementResult && !placementResult.correct && placementResult.song) {
      return (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 40, minWidth: 280, borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        }}>
          <div style={{ background: 'var(--bad)', padding: '10px 20px', textAlign: 'center', color: '#fff', fontWeight: 700 }}>
            ✗ Wrong placement
          </div>
          <div style={{ background: 'var(--surface)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--on-surface)' }}>{placementResult.song.title}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{placementResult.song.artist}</div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--accent)', lineHeight: 1 }}>{placementResult.song.year}</div>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {renderToast()}

      {/* ── Top bar ── */}
      <div style={{
        padding: '16px 28px',
        borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Logo />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>Room</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, letterSpacing: '0.18em', color: 'var(--accent)', fontWeight: 600 }}>
            {useGameStore.getState().roomCode ?? '—'}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            {players.length} players
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            First to 10 cards wins
          </span>
        </div>
      </div>

      {/* ── Three-column body ── */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '260px 1fr 300px',
        minHeight: 0,
      }}>

        {/* ── LEFT RAIL: Players + shortcuts ── */}
        <aside style={{
          padding: '20px 20px',
          borderRight: '1px solid var(--line)',
          overflowY: 'auto',
          background: 'var(--bg)',
        }}>
          <SectionMark>Crowd</SectionMark>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map((p, i) => {
              const active = p.id === currentPlayerId
              const isMe = p.id === playerId
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  borderRadius: 14,
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? 'var(--accent-ink)' : 'var(--on-bg)',
                  border: active ? 'none' : '1px solid var(--line)',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: PLAYER_COLORS[i % PLAYER_COLORS.length],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: 18,
                    color: '#1a1612', flexShrink: 0,
                  }}>{p.name.charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {p.name}{isMe ? ' (you)' : ''}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9,
                      letterSpacing: '0.1em',
                      opacity: active ? 0.8 : 0.6,
                      marginTop: 2,
                    }}>{p.timeline.length}/10 cards · {p.tokens}★</div>
                  </div>
                  {active && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>
                      now
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 28 }}>
            <SectionMark>Shortcuts</SectionMark>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['SPACE', 'Play / pause'], ['← →', 'Move card'], ['↵', 'Lock placement'], ['G', 'Guess input']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <kbd style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    padding: '3px 7px', borderRadius: 6,
                    border: '1px solid var(--line)',
                    background: 'color-mix(in oklch, var(--on-bg) 4%, transparent)',
                    minWidth: 34, textAlign: 'center',
                    color: 'var(--on-bg)',
                  }}>{k}</kbd>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── CENTER: Stage ── */}
        <main style={{
          padding: '24px 32px',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          {currentSong && <AudioPlayer song={currentSong} isMyTurn={isMyTurn} />}

          {currentSong && (
            <>
              {/* Timeline heading */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <SectionMark>
                    {isMyTurn ? `Your timeline · ${myPlayer?.name}` : `${activePlayer?.name}'s timeline`}
                  </SectionMark>
                  {isMyTurn && activeTimeline.length > 0 && (
                    <h2 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 24, margin: '6px 0 0',
                      letterSpacing: '-0.02em', color: 'var(--on-bg)',
                    }}>
                      Place between{' '}
                      <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                        {activeTimeline[Math.max(0, 1) - 1]?.song.year ?? '?'}
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
                onPlace={handlePlace}
                isMyTurn={isMyTurn}
                isWaiting={isWaitingForNextTurn}
                spectatorDragSlot={isMyTurn ? null : remoteDragSlot}
              />

              {/* Skip button */}
              {isMyTurn && !isWaitingForNextTurn && (myPlayer?.tokens ?? 0) >= 1 && (
                <button
                  onClick={handleSkip}
                  style={{
                    alignSelf: 'center',
                    background: 'none', border: '1px solid var(--line)',
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

          {/* All other players' timelines (including viewer's own when not their turn) */}
          {players.filter((p) => p.id !== currentPlayerId).length > 0 && (
            <div style={{ marginTop: 8 }}>
              <SectionMark>Timelines · live</SectionMark>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {players
                  .filter((p) => p.id !== currentPlayerId)
                  .map((p) => (
                    <div key={p.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: PLAYER_COLORS[(players.indexOf(p)) % PLAYER_COLORS.length],
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-display)', fontSize: 13, color: '#1a1612',
                        }}>{p.name.charAt(0).toUpperCase()}</div>
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

        {/* ── RIGHT RAIL: Guess + log ── */}
        <aside style={{
          padding: '20px 20px',
          borderLeft: '1px solid var(--line)',
          overflowY: 'auto',
          background: 'var(--bg)',
        }}>
          <SectionMark>Bonus guess</SectionMark>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, lineHeight: 1.4 }}>
            Optional. Fill in before placing — submitted with your card.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            <input
              placeholder="Artist"
              value={guess.artist}
              onChange={(e) => setGuess((g) => ({ ...g, artist: e.target.value }))}
              disabled={!isMyTurn || isWaitingForNextTurn}
              style={{
                height: 44, borderRadius: 12,
                border: '1px solid var(--line)',
                background: 'transparent', color: 'var(--on-bg)',
                padding: '0 14px', fontSize: 14,
                fontFamily: 'var(--font-body)', outline: 'none',
                opacity: !isMyTurn || isWaitingForNextTurn ? 0.4 : 1,
              }}
            />
            <input
              placeholder="Title"
              value={guess.title}
              onChange={(e) => setGuess((g) => ({ ...g, title: e.target.value }))}
              disabled={!isMyTurn || isWaitingForNextTurn}
              style={{
                height: 44, borderRadius: 12,
                border: '1px solid var(--line)',
                background: 'transparent', color: 'var(--on-bg)',
                padding: '0 14px', fontSize: 14,
                fontFamily: 'var(--font-body)', outline: 'none',
                opacity: !isMyTurn || isWaitingForNextTurn ? 0.4 : 1,
              }}
            />
          </div>

          {/* Action log */}
          <div style={{ marginTop: 28 }}>
            <SectionMark>Action log</SectionMark>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stealResult && (() => {
                const stealerName = players.find((p) => p.id === stealResult.stealerId)?.name ?? 'Someone'
                return (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', marginTop: 6, flexShrink: 0, background: stealResult.correct ? 'var(--good)' : 'var(--bad)', display: 'inline-block' }} />
                    <div>
                      <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--on-bg)' }}>
                        <b>{stealerName}</b> {stealResult.correct ? 'stole successfully' : 'failed to steal'}
                      </div>
                    </div>
                  </div>
                )
              })()}
              {placementResult && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', marginTop: 6, flexShrink: 0, background: placementResult.correct ? 'var(--good)' : 'var(--bad)', display: 'inline-block' }} />
                  <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--on-bg)' }}>
                    <b>{activePlayer?.name}</b> {placementResult.correct ? 'placed correctly' : 'missed placement'}
                    {placementResult.song && !placementResult.correct && (
                      <span style={{ color: 'var(--muted)' }}> · {placementResult.song.title} ({placementResult.song.year})</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Deck mini stats */}
          <div style={{ marginTop: 28, padding: '14px 16px', border: '1px solid var(--line)', borderRadius: 16 }}>
            <SectionMark>Deck</SectionMark>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
              {[
                ['Players', `${players.length}`],
                ['Cards needed', '10'],
                ['Your cards', `${myPlayer?.timeline.length ?? 0}`],
                ['Your ★', `${myPlayer?.tokens ?? 0}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>{k}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--accent)', marginTop: 2, lineHeight: 1 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Steal button */}
      {isStealWindowOpen && (() => {
        const stealerName = stealInitiatorId ? players.find((p) => p.id === stealInitiatorId)?.name : null
        return (
          <div style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            zIndex: 30, display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 20px', borderRadius: 999,
            background: 'var(--surface)', border: `1px solid ${stealerName ? 'var(--accent)' : 'var(--line)'}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}>
            {stealerName ? (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                ⚡ {stealerName} is stealing…
              </span>
            ) : (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                steal window
              </span>
            )}
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1,
              color: countdown <= 3 ? 'var(--bad)' : 'var(--accent)',
            }}>
              {countdown}
            </span>
          </div>
        )
      })()}

      {canSteal && (
        <button
          onClick={() => { socket.emit('steal:initiated', playerId ?? ''); setIsAttemptingSteal(true) }}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 30,
            padding: '12px 20px', borderRadius: 999,
            background: 'var(--accent)', color: 'var(--accent-ink)',
            border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}
        >
          Steal! · 1 ★
        </button>
      )}
    </div>
  )
}

export default GamePage
