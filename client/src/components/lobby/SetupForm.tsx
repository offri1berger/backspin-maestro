import type { Decade } from '@hitster/shared'
import ImagePicker from '../ImagePicker'
import { AVATARS } from '../../lib/avatars'
import { Logo, ArrowIcon } from './Logo'

const DECADES: { label: string; value: Decade }[] = [
  { label: 'All', value: 'all' },
  { label: '60s', value: '60s' },
  { label: '70s', value: '70s' },
  { label: '80s', value: '80s' },
  { label: '90s', value: '90s' },
  { label: '00s', value: '00s' },
  { label: '10s', value: '10s' },
]

function DecadePicker({ decade, onChange }: { decade: Decade; onChange: (d: Decade) => void }) {
  return (
    <div>
      <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">Decade</label>
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-1.5 mt-2">
        {DECADES.map((d) => (
          <button
            key={d.value}
            onClick={() => onChange(d.value)}
            className={`h-9 lg:h-10 rounded-[10px] font-mono text-[10px] tracking-[0.08em] font-semibold cursor-pointer transition-colors duration-150 ${
              decade === d.value
                ? 'bg-accent text-accent-ink border-none'
                : 'bg-transparent text-on-bg border border-line'
            }`}
          >
            {d.label}
          </button>
        ))}
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
  decade: Decade
  onDecadeChange: (d: Decade) => void
  avatar: string | undefined
  onAvatarChange: (v: string | undefined) => void
  onSubmit: () => void
}

export function SetupForm({
  tab, onTabChange,
  name, onNameChange,
  roomCode, onRoomCodeChange,
  decade, onDecadeChange,
  avatar, onAvatarChange,
  onSubmit,
}: SetupFormProps) {
  const isCreate = tab === 'create'
  const disabled = isCreate ? !name.trim() : !name.trim() || !roomCode.trim()

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
        <div className="flex items-center gap-3">
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
              onChange={(e) => onRoomCodeChange(e.target.value.toUpperCase())}
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
            <DecadePicker decade={decade} onChange={onDecadeChange} />

            {/* Settings info — desktop only (informational, not needed on mobile) */}
            <div className="hidden lg:grid grid-cols-2 gap-3">
              {[
                { label: 'Songs to win', val: '10', sub: '≈25 min' },
                { label: 'Stealing',     val: 'On', sub: '4s window' },
              ].map(({ label, val, sub }) => (
                <div key={label}>
                  <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">{label}</p>
                  <div className="mt-2 px-4 py-3 border border-line rounded-[14px] flex items-center justify-between">
                    <span className="font-display text-[28px] text-accent leading-none">{val}</span>
                    <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted">{sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex-1 lg:max-h-16" />

      <button
        onClick={onSubmit}
        disabled={disabled}
        className="mt-6 lg:mt-7 w-full h-[56px] lg:h-[60px] rounded-full bg-accent text-accent-ink border-none cursor-pointer font-body font-semibold text-[17px] flex items-center justify-center gap-2.5 transition-opacity duration-150 disabled:opacity-40"
      >
        {isCreate ? 'Cut the deck' : 'Join room'}
        <ArrowIcon />
      </button>
    </div>
  )
}
