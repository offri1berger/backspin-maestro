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
      <div
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        style={{ background: 'rgba(0,0,0,0.55)' }}
      >
        <div
          className="min-w-[320px] max-w-[420px] rounded-[24px] overflow-hidden"
          style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}
        >
          <div className={`${isGoodForMe ? 'bg-good' : 'bg-bad'} px-7 py-5 text-center`}>
            <div className="text-[32px] mb-2">{isGoodForMe ? '🎉' : '😬'}</div>
            <div className="font-bold text-lg text-white leading-snug">{headline}</div>
            {subline && <div className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.8)' }}>{subline}</div>}
          </div>
          <div className="bg-surface px-6 py-3.5 flex justify-between items-center">
            <div>
              <div className="font-semibold text-sm text-on-surface">{stealResult.song.title}</div>
              <div className="font-mono text-[11px] text-muted mt-0.5">{stealResult.song.artist}</div>
            </div>
            <div className="font-display text-[32px] text-accent leading-none">{stealResult.song.year}</div>
          </div>
        </div>
      </div>
    )
  }

  if (placementResult?.correct) {
    return (
      <div
        className="fixed top-6 left-1/2 z-40 px-6 py-3 rounded-full bg-good text-white font-bold text-base"
        style={{ transform: 'translateX(-50%)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
      >
        {placementResult.message ?? '✓ Correct!'}
      </div>
    )
  }

  if (placementResult && !placementResult.correct && placementResult.song) {
    return (
      <div
        className="fixed top-6 left-1/2 z-40 min-w-[280px] rounded-[20px] overflow-hidden"
        style={{ transform: 'translateX(-50%)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
      >
        <div className="bg-bad px-5 py-2.5 text-center text-white font-bold">
          ✗ Wrong placement
        </div>
        <div className="bg-surface px-5 py-3 flex justify-between items-center">
          <div>
            <div className="font-semibold text-sm text-on-surface">{placementResult.song.title}</div>
            <div className="font-mono text-[11px] text-muted mt-0.5">{placementResult.song.artist}</div>
          </div>
          <div className="font-display text-[28px] text-accent leading-none">{placementResult.song.year}</div>
        </div>
      </div>
    )
  }

  return null
}
