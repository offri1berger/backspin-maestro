import { useGameStore } from '../../store/gameStore'

export const ResultToast = () => {
  const { stealResult, placementResult, players, playerId } = useGameStore()

  if (stealResult) {
    const stealerName = players.find((p) => p.id === stealResult.stealerId)?.name ?? 'Someone'
    const targetName = players.find((p) => p.id === stealResult.targetPlayerId)?.name ?? 'them'
    const iAmStealer = stealResult.stealerId === playerId
    const iAmTarget = stealResult.targetPlayerId === playerId
    const { correct: success, targetWasCorrect } = stealResult

    const isGoodForMe = iAmStealer ? success : iAmTarget ? targetWasCorrect : success

    let headline = ''
    let subline = ''
    if (success) {
      headline = iAmStealer ? 'You stole it!'
        : iAmTarget ? `${stealerName} stole your card!`
        : `${stealerName} stole the card!`
      subline = iAmStealer ? 'Card added to your timeline.'
        : iAmTarget ? 'Your card goes to their timeline.'
        : ''
    } else if (targetWasCorrect) {
      headline = iAmStealer ? 'Steal failed — they placed correctly'
        : iAmTarget ? `${stealerName} tried to steal but failed!`
        : `${stealerName}'s steal failed`
      subline = iAmStealer ? `${targetName} was right all along. You lost 1 ★.`
        : iAmTarget ? `${stealerName} placed it wrong — your card is safe.`
        : `${targetName} placed correctly — nothing was stolen.`
    } else {
      headline = iAmStealer ? 'Steal failed — wrong position'
        : iAmTarget ? `${stealerName} tried to steal but missed!`
        : `${stealerName}'s steal failed`
      subline = iAmStealer ? 'Your position was incorrect. You lost 1 ★.'
        : iAmTarget ? 'Wrong position — your card stays.'
        : 'Wrong position — steal attempt missed.'
    }

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)', pointerEvents: 'none',
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
        fontWeight: 700, fontSize: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
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
