import { Logo } from './Logo'

const NAV_LINKS = ['How to play', 'Songbook', 'Sign in']

const STATS = [
  { val: '200,000+', label: 'tracks' },
  { val: '8',        label: 'decades' },
  { val: '∞',        label: 'good times' },
]

export function HeroPanel() {
  return (
    <div className="px-16 py-14 flex flex-col relative overflow-hidden">
      <div className="vinyl vinyl-spin absolute left-[-220px] bottom-[-220px] w-[480px] h-[480px] opacity-[0.85]" />

      <div className="relative flex items-center justify-between">
        <Logo />
        <nav className="flex gap-7">
          {NAV_LINKS.map((l) => (
            <span key={l} className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted cursor-pointer">
              {l}
            </span>
          ))}
        </nav>
      </div>

      <div className="relative flex-1 flex flex-col justify-center">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-accent">
          Side A · 2–6 players · No app needed
        </p>
        <h1 className="font-display text-[130px] leading-[0.88] mt-3.5 mb-0 tracking-[-0.02em] text-on-bg">
          Name<br />
          <em className="italic text-accent">that</em><br />
          tune.
        </h1>
        <p className="mt-7 text-[17px] leading-[1.55] text-muted max-w-[440px]">
          A music timeline party. Drag mystery hits onto your chronicle.
          First to ten correctly placed cards wins the night.
        </p>
      </div>

      <div className="relative flex gap-9 font-mono text-[11px] tracking-[0.1em] text-muted">
        {STATS.map(({ val, label }) => (
          <div key={label}>
            <span className="text-accent">{val}</span> {label}
          </div>
        ))}
      </div>
    </div>
  )
}
