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

    let headline: string
    let subline: string
    if (success) {
      headline = iAmStealer ? 'YOU STOLE IT!'
        : iAmTarget ? `${stealerName} STOLE YOUR CARD!`
        : `${stealerName} STOLE THE CARD!`
      subline = iAmStealer ? 'Card added to your shelf.'
        : iAmTarget ? 'Your card goes to their shelf.'
        : ''
    } else if (targetWasCorrect) {
      headline = iAmStealer ? 'STEAL FAILED — THEY PLACED RIGHT'
        : iAmTarget ? `${stealerName} TRIED — AND FAILED!`
        : `${stealerName}'S STEAL FAILED`
      subline = iAmStealer ? `${targetName} was right all along. You lost 1 ★.`
        : iAmTarget ? `${stealerName} placed it wrong — your card is safe.`
        : `${targetName} placed correctly — nothing was stolen.`
    } else {
      headline = iAmStealer ? 'STEAL MISSED — WRONG SPOT'
        : iAmTarget ? `${stealerName} TRIED TO STEAL BUT MISSED!`
        : `${stealerName}'S STEAL MISSED`
      subline = iAmStealer ? 'Wrong position. You lost 1 ★.'
        : iAmTarget ? 'Wrong position — your card stays.'
        : 'Wrong position — steal attempt missed.'
    }

    const bgVar = isGoodForMe ? 'var(--color-good)' : 'var(--color-bad)'

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4 [background:rgba(0,0,0,0.6)] [backdrop-filter:blur(8px)]"
        role="alert"
        aria-live="assertive"
      >
        <div
          className="brushed-darker panel-hardware min-w-[320px] max-w-[420px] overflow-hidden pop-in rounded-2xl"
        >
          <div
            className="px-6 py-5 text-center"
            style={{ background: `linear-gradient(180deg, ${bgVar}, color-mix(in srgb, ${bgVar} 70%, #000))` }}
          >
            <div className="text-[36px] mb-1" aria-hidden>{isGoodForMe ? '🎉' : '😬'}</div>
            <span className="sr-only">{isGoodForMe ? 'Success: ' : 'Failure: '}</span>
            <div
              className="font-display text-lg text-white [text-shadow:3px_3px_0_rgba(0,0,0,.5)] tracking-[.02em]"
            >
              {headline}
            </div>
            {subline && (
              <div className="text-[13px] mt-1.5 text-[rgba(255,255,255,0.9)]">{subline}</div>
            )}
          </div>
          <div className="px-5 py-3 flex justify-between items-center bg-[#0a0a0a]">
            <div>
              <div
                className="font-display text-[13px] text-cream"
              >
                {stealResult.song.title}
              </div>
              <div className="font-mono mt-0.5 text-[13px] text-[var(--color-muted)]">
                {stealResult.song.artist}
              </div>
            </div>
            <div
              className="font-display text-[32px] text-accent leading-none [text-shadow:2px_2px_0_var(--color-hot),4px_4px_0_var(--color-accent-ink)]"
            >
              {stealResult.song.year}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (placementResult) {
    const correct = placementResult.correct
    const song = placementResult.song
    const headline = correct ? (placementResult.message ?? 'CORRECT!') : 'WRONG PLACEMENT'
    const bgVar = correct ? 'var(--color-good)' : 'var(--color-bad)'
    return (
      <div
        className="fixed top-6 left-1/2 z-40 w-[320px] overflow-hidden pop-in -translate-x-1/2 rounded-xl border-2 border-[#0a0a0a] [box-shadow:0_8px_22px_rgba(0,0,0,.4)]"
        role={correct ? 'status' : 'alert'}
        aria-live={correct ? 'polite' : 'assertive'}
      >
        <div
          className="px-4 py-2 text-center font-display text-white text-sm tracking-[.05em] [text-shadow:2px_2px_0_rgba(0,0,0,.4)]"
          style={{ background: `linear-gradient(180deg, ${bgVar}, color-mix(in srgb, ${bgVar} 70%, #000))` }}
        >
          <span aria-hidden>{correct ? '✓ ' : '✗ '}</span>
          {headline.toUpperCase()}
        </div>
        {song && (
          <div className="px-4 py-2.5 flex justify-between items-center gap-3 bg-[#0a0a0a]">
            <div className="min-w-0">
              <div className="font-display truncate text-[13px] text-cream">
                {song.title}
              </div>
              <div className="font-mono mt-0.5 truncate text-[13px] text-[var(--color-muted)]">
                {song.artist}
              </div>
            </div>
            <div
              className="font-display shrink-0 text-[28px] text-accent leading-none [text-shadow:2px_2px_0_var(--color-hot)]"
            >
              {song.year}
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}
