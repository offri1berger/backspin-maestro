// Tiny Web Audio synth — no asset files. Tones are short envelopes
// (attack/decay) on a single oscillator. Good enough for game feedback;
// trivially overridable later if we want sampled SFX.

let ctx: AudioContext | null = null
let mutedFn: () => boolean = () => false

const AudioContextClass: typeof AudioContext | undefined =
  typeof window !== 'undefined'
    ? window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    : undefined

const getCtx = (): AudioContext | null => {
  if (!AudioContextClass) return null
  if (!ctx) ctx = new AudioContextClass()
  return ctx
}

export const setMutedAccessor = (fn: () => boolean) => { mutedFn = fn }

const playTone = (
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.15,
) => {
  if (mutedFn()) return
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') c.resume().catch(() => {})
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  const t = c.currentTime
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(volume, t + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(gain).connect(c.destination)
  osc.start(t)
  osc.stop(t + duration + 0.05)
}

export const sfx = {
  // Soft thump when a card snaps into a slot.
  place: () => playTone(180, 0.12, 'triangle', 0.18),

  // Two-note ascending chime — C5 → G5.
  correct: () => {
    playTone(523.25, 0.18, 'sine', 0.16)
    setTimeout(() => playTone(783.99, 0.26, 'sine', 0.18), 90)
  },

  // Two-note descending buzz — A3 → Eb3.
  wrong: () => {
    playTone(220, 0.18, 'sawtooth', 0.12)
    setTimeout(() => playTone(155.56, 0.28, 'sawtooth', 0.14), 90)
  },

  // Short high tick used for steal-window urgency.
  tick: () => playTone(880, 0.06, 'square', 0.07),

  // Quick arpeggio — C5, E5, G5, C6.
  win: () => {
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.32, 'triangle', 0.14), i * 110)
    })
  },
}
