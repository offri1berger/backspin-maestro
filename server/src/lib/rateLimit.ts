const makeLimiter = (max: number, windowMs: number) => {
  const buckets = new Map<string, { count: number; resetAt: number }>()

  const allow = (key: string): boolean => {
    const now = Date.now()
    const b = buckets.get(key)
    if (!b || now > b.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
      return true
    }
    if (b.count >= max) return false
    b.count++
    return true
  }

  const clear = (key: string) => buckets.delete(key)

  return { allow, clear }
}

export const roomLimiter  = makeLimiter(10, 60_000)  // 10 room actions / min
export const placeLimiter = makeLimiter(5,   5_000)  // 5 placements / 5s
export const stealLimiter = makeLimiter(5,   5_000)  // 5 steal actions / 5s
export const skipLimiter  = makeLimiter(5,  15_000)  // 5 skips / 15s
export const guessLimiter = makeLimiter(20, 10_000)  // 20 guesses / 10s (typing)

export const clearAllLimits = (socketId: string) => {
  roomLimiter.clear(socketId)
  placeLimiter.clear(socketId)
  stealLimiter.clear(socketId)
  skipLimiter.clear(socketId)
  guessLimiter.clear(socketId)
}
