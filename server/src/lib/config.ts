// Game-tuning knobs. Env-overridable so tests (and per-environment deploys)
// can change timing without recompiling. Reads env at module load — set vars
// before importing, or mock this module in tests that need different values.

const num = (key: string, fallback: number): number => {
  const raw = process.env[key]
  if (raw === undefined) return fallback
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

export const config = {
  stealWindowMs: num('STEAL_WINDOW_MS', 5_000),
  stealExtendedMs: num('STEAL_EXTENDED_MS', 10_000),
  cardRevealMs: num('CARD_REVEAL_MS', 3_000),
  reconnectGraceMs: num('RECONNECT_GRACE_MS', 30_000),
  starterTokens: num('STARTER_TOKENS', 2),
}
