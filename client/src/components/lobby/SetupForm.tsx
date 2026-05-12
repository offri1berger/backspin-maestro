import type { DecadeFilter, SpecificDecade } from '@hitster/shared'
import { SPECIFIC_DECADES_ORDER } from '@hitster/shared'
import ImagePicker from '../ui/ImagePicker'
import { AVATARS } from '../../lib/avatars'
import { Logo, ArrowIcon } from '../ui/Logo'

const SPECIFIC_DECADES: { label: string; value: SpecificDecade }[] = [
  { label: '60s', value: '60s' },
  { label: '70s', value: '70s' },
  { label: '80s', value: '80s' },
  { label: '90s', value: '90s' },
  { label: '00s', value: '00s' },
  { label: '10s', value: '10s' },
];

const toggleAndFill = (current: SpecificDecade[], clicked: SpecificDecade): SpecificDecade[] => {
  const set = new Set(current)
  if (set.has(clicked)) set.delete(clicked)
  else set.add(clicked)
  if (set.size === 0) return current  // require at least one
  const indices = [...set].map((d) => SPECIFIC_DECADES_ORDER.indexOf(d))
  const min = Math.min(...indices)
  const max = Math.max(...indices)
  return SPECIFIC_DECADES_ORDER.slice(min, max + 1)
}

const DecadePicker = ({
  decadeFilter,
  onChange,
}: {
  decadeFilter: DecadeFilter
  onChange: (d: DecadeFilter) => void
}) => {
  const isAll = decadeFilter === 'all'
  const selected = isAll ? new Set<SpecificDecade>() : new Set(decadeFilter)

  const handleChip = (d: SpecificDecade) => {
    if (isAll) {
      onChange([d])
      return
    }
    onChange(toggleAndFill(decadeFilter, d))
  }

  return (
    <div>
      <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">Decade</label>
      <div className="grid grid-cols-4 lg:grid-cols-7 gap-1.5 mt-2">
        <button
          onClick={() => onChange('all')}
          className={`h-9 lg:h-10 rounded-[10px] font-mono text-[10px] tracking-[0.08em] font-semibold cursor-pointer transition-colors duration-150 ${
            isAll ? 'bg-accent text-accent-ink border-none' : 'bg-transparent text-on-bg border border-line'
          }`}
        >
          All
        </button>
        {SPECIFIC_DECADES.map((d) => {
          const active = selected.has(d.value)
          return (
            <button
              key={d.value}
              onClick={() => handleChip(d.value)}
              className={`h-9 lg:h-10 rounded-[10px] font-mono text-[10px] tracking-[0.08em] font-semibold cursor-pointer transition-colors duration-150 ${
                active ? 'bg-accent text-accent-ink border-none' : 'bg-transparent text-on-bg border border-line'
              }`}
            >
              {d.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export interface SetupFormProps {
  tab: 'create' | 'join'
  onTabChange: (t: 'create' | 'join') => void
  name: string
  onNameChange: (v: string) => void
  roomCode: string
  onRoomCodeChange: (v: string) => void
  decadeFilter: DecadeFilter
  onDecadeChange: (d: DecadeFilter) => void
  songsPerPlayer: number
  onSongsPerPlayerChange: (n: number) => void
  avatar: string | undefined
  onAvatarChange: (v: string | undefined) => void
  onSubmit: () => void
  error?: string | null
  submitting?: boolean
}

export const SetupForm = ({
  tab, onTabChange,
  name, onNameChange,
  roomCode, onRoomCodeChange,
  decadeFilter, onDecadeChange,
  songsPerPlayer, onSongsPerPlayerChange,
  avatar, onAvatarChange,
  onSubmit,
  error,
  submitting = false,
}: SetupFormProps) => {
  const isCreate = tab === 'create'
  const disabled = (isCreate ? !name.trim() : !name.trim() || !roomCode.trim()) || submitting

  return (
    <div className="min-h-screen lg:h-screen flex flex-col px-5 py-6 lg:px-16 lg:py-14 bg-bg-2 lg:border-l border-line lg:overflow-hidden">
      {/* Mobile-only logo */}
      <div className="lg:hidden mb-5">
        <Logo />
      </div>

      <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">Track 01 · Set up the room</p>
      <h2 className="font-display text-[36px] lg:text-[48px] mt-2 mb-5 lg:mb-7 leading-none tracking-[-0.02em] text-on-bg">
        Cue up<br />a session.
      </h2>

      {/* Tab toggle */}
      <div className="flex gap-1 mb-4 lg:mb-6 p-1 rounded-full self-start bg-on-bg/6">
        {(['create', 'join'] as const).map((t) => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            className={`px-5 py-2 rounded-full border-none font-mono text-[11px] tracking-[0.15em] uppercase font-bold cursor-pointer transition-colors duration-150 ${
              tab === t ? 'bg-accent text-accent-ink' : 'bg-transparent text-on-bg'
            }`}
          >
            {t === 'create' ? 'Create' : 'Join code'}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:gap-4">
        {/* Avatar + name */}
        <div className="flex items-start gap-3">
          <ImagePicker
            options={AVATARS}
            value={avatar}
            onChange={onAvatarChange}
            fallback={name.trim() ? name.trim().charAt(0).toUpperCase() : '?'}
            label="avatar"
          />
          <div className="flex-1">
            <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">Your name</label>
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter your name"
              style={{ fontSize: 16 }}
              className="block w-full mt-2 h-[48px] lg:h-[52px] rounded-[14px] border border-line bg-transparent text-on-bg px-[18px] font-body outline-none box-border focus:border-accent"
            />
          </div>
        </div>

        {/* Room code (join only) */}
        {!isCreate && (
          <div>
            <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">Room code</label>
            <input
              value={roomCode}
              onChange={(e) => onRoomCodeChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="VINYL"
              maxLength={6}
              style={{ fontSize: 20 }}
              className="block w-full mt-2 h-[48px] lg:h-[52px] rounded-[14px] border border-line bg-transparent text-accent font-mono tracking-[0.25em] uppercase text-center outline-none box-border focus:border-accent"
            />
          </div>
        )}

        {/* Decade + settings (create only) */}
        {isCreate && (
          <>
            <DecadePicker decadeFilter={decadeFilter} onChange={onDecadeChange} />

            {/* Settings */}
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">Songs to win</p>
              <div className="mt-2 px-2 py-3 border border-line rounded-[14px] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onSongsPerPlayerChange(Math.max(3, songsPerPlayer - 1))}
                  className="w-8 h-8 flex items-center justify-center font-mono text-[20px] text-muted hover:text-on-bg cursor-pointer bg-transparent border-none rounded-[8px] hover:bg-on-bg/5 transition-colors leading-none"
                >−</button>
                <div className="flex flex-col items-center">
                  <span className="font-display text-[28px] text-accent leading-none">{songsPerPlayer}</span>
                  <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-muted mt-0.5">≈{Math.round(songsPerPlayer * 2.5)} min</span>
                </div>
                <button
                  type="button"
                  onClick={() => onSongsPerPlayerChange(Math.min(20, songsPerPlayer + 1))}
                  className="w-8 h-8 flex items-center justify-center font-mono text-[20px] text-muted hover:text-on-bg cursor-pointer bg-transparent border-none rounded-[8px] hover:bg-on-bg/5 transition-colors leading-none"
                >+</button>
              </div>
              <p className="mt-2.5 font-mono text-[10px] tracking-[0.15em] uppercase text-muted">
                Stealing on · 4s window
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 lg:max-h-16" />

      {error && (
        <p
          role="alert"
          aria-live="polite"
          className="mt-4 -mb-2 font-mono text-[11px] tracking-[0.1em] uppercase text-bad text-center"
        >
          {error}
        </p>
      )}

      <button
        onClick={onSubmit}
        disabled={disabled}
        title={disabled && !submitting ? (isCreate ? 'Enter a name first' : 'Enter a name and room code') : undefined}
        className="mt-6 lg:mt-7 w-full h-[56px] lg:h-[60px] rounded-full bg-accent text-accent-ink border-none cursor-pointer font-body font-semibold text-[17px] flex items-center justify-center gap-2.5 transition-opacity duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <span className="inline-block w-4 h-4 rounded-full border-2 border-accent-ink border-r-transparent animate-spin" aria-hidden />
            {isCreate ? 'Creating…' : 'Joining…'}
          </>
        ) : (
          <>
            {isCreate ? 'Cut the deck' : 'Join room'}
            <ArrowIcon />
          </>
        )}
      </button>
    </div>
  )
}
