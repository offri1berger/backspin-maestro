import type { DecadeFilter } from '@backspin-maestro/shared'
import ImagePicker from '../ui/ImagePicker'
import { AVATARS } from '../../lib/avatars'
import { Logo } from '../ui/Logo'
import { DecadePicker } from './DecadePicker'
import LedDisplay from '../boombox/LedDisplay'
import PlasticButton from '../boombox/PlasticButton'

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
    <div className="relative min-h-dvh lg:min-h-0 lg:h-full flex flex-col lg:overflow-hidden p-5 lg:p-7">
      {/* Mobile-only logo */}
      <div className="lg:hidden mb-4">
        <Logo />
      </div>

      <div
        className="relative panel-hardware brushed-dark flex-1 lg:overflow-y-auto p-5 lg:p-6 flex flex-col gap-3.5 lg:gap-4"
      >
        {/* Corner screws */}
        <span className="screw" style={{ top: 8, left: 8 }} />
        <span className="screw" style={{ top: 8, right: 8 }} />
        <span className="screw" style={{ bottom: 8, left: 8 }} />
        <span className="screw" style={{ bottom: 8, right: 8 }} />

        <LedDisplay color="green" className="text-[18px] lg:text-[22px]">
          {tab === 'create' ? '▶ NEW MIX' : '◀ JOIN MIX'}
        </LedDisplay>

        {/* Avatar + name */}
        <div className="flex items-start gap-3.5">
          <ImagePicker
            options={AVATARS}
            value={avatar}
            onChange={onAvatarChange}
            fallback={name.trim() ? name.trim().charAt(0).toUpperCase() : '?'}
            label="avatar"
          />
          <div className="flex-1 min-w-0">
            <div className="font-display text-[10px] tracking-[0.1em] mb-1.5" style={{ color: 'var(--color-accent)' }}>
              YOUR DJ NAME
            </div>
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="DJ_BOOMBAP"
              style={{ fontSize: 16, fontFamily: 'var(--font-code)', fontWeight: 700 }}
              className="block w-full h-[48px] lg:h-[52px] rounded-[8px] border-2 border-[#0a0a0a] px-3.5 outline-none box-border"
            />
            <style>{`input { background: var(--color-cream); color: var(--color-accent-ink); box-shadow: inset 0 2px 4px rgba(0,0,0,.2); }`}</style>
          </div>
        </div>

        {/* Tab toggle — segmented plastic */}
        <div
          className="flex gap-0 rounded-[8px] p-1"
          style={{ background: '#0a0a0a', boxShadow: 'inset 0 2px 4px rgba(0,0,0,.8)' }}
        >
          {(['create', 'join'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTabChange(t)}
              className="flex-1 px-3 py-2.5 rounded-[6px] border-0 cursor-pointer font-display text-[12px] tracking-[0.05em]"
              style={tab === t
                ? {
                    background: 'linear-gradient(180deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 75%, #000))',
                    color: 'var(--color-accent-ink)',
                    boxShadow: 'inset 0 -2px 0 rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.4)',
                  }
                : { background: 'transparent', color: 'var(--color-cream)' }
              }
            >
              {t === 'create' ? 'CREATE' : 'JOIN CODE'}
            </button>
          ))}
        </div>

        {!isCreate && (
          <div>
            <div className="font-display text-[10px] tracking-[0.1em] mb-1.5" style={{ color: 'var(--color-cyan)' }}>
              TUNE IN ▸ ROOM CODE
            </div>
            <div className="relative">
              <LedDisplay color="cyan" className="text-center" style={{ fontSize: 28, letterSpacing: '.35em', padding: '12px 16px' }}>
                {(roomCode || '______').padEnd(6, '_')}
              </LedDisplay>
              <input
                value={roomCode}
                onChange={(e) => onRoomCodeChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder=""
                maxLength={6}
                aria-label="Room code"
                style={{ fontSize: 16 }}
                className="absolute inset-0 w-full opacity-0 cursor-text"
              />
            </div>
          </div>
        )}

        {isCreate && (
          <>
            <DecadePicker decadeFilter={decadeFilter} onChange={onDecadeChange} />

            <div>
              <div className="font-display text-[10px] tracking-[0.1em] mb-1.5" style={{ color: 'var(--color-cyan)' }}>
                FIRST TO {songsPerPlayer} SONGS
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSongsPerPlayerChange(Math.max(3, songsPerPlayer - 1))}
                  aria-label="Fewer songs"
                  className="knob-btn shrink-0"
                  style={{
                    width: 40, height: 40,
                    background: 'radial-gradient(circle at 30% 25%, var(--color-bad), color-mix(in srgb, var(--color-bad) 50%, #000))',
                    boxShadow: 'inset 0 -3px 6px rgba(0,0,0,.4), inset 0 2px 4px rgba(255,255,255,.4), 0 3px 0 color-mix(in srgb, var(--color-bad) 40%, #000)',
                    color: '#fff', fontSize: 18,
                  }}
                >−</button>
                <LedDisplay
                  color="yellow"
                  className="flex-1 text-center"
                  style={{ fontSize: 16, padding: '8px 12px' }}
                >
                  {songsPerPlayer}·{Math.round(songsPerPlayer * 2.5)}M
                </LedDisplay>
                <button
                  type="button"
                  onClick={() => onSongsPerPlayerChange(Math.min(20, songsPerPlayer + 1))}
                  aria-label="More songs"
                  className="knob-btn shrink-0"
                  style={{
                    width: 40, height: 40,
                    background: 'radial-gradient(circle at 30% 25%, var(--color-good), color-mix(in srgb, var(--color-good) 50%, #000))',
                    boxShadow: 'inset 0 -3px 6px rgba(0,0,0,.4), inset 0 2px 4px rgba(255,255,255,.4), 0 3px 0 color-mix(in srgb, var(--color-good) 40%, #000)',
                    color: 'var(--color-accent-ink)', fontSize: 18,
                  }}
                >+</button>
              </div>
            </div>

            <div
              className="rounded-[8px] flex gap-3 items-start p-3.5"
              style={{
                background: '#0a0a0a',
                border: '2px solid color-mix(in srgb, var(--color-accent) 40%, transparent)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,.8)',
              }}
            >
              <div className="font-display text-[22px] leading-none" style={{ color: 'var(--color-accent)', textShadow: '2px 2px 0 #000' }}>★</div>
              <div className="text-[11px] leading-snug" style={{ color: 'var(--color-cream)' }}>
                <div className="font-display text-[11px] mb-0.5" style={{ color: 'var(--color-accent)' }}>READY THE BOOTH</div>
                Decade dial, win count, and steal rules wait in the waiting room.
                Get a name + face down first.
              </div>
            </div>
          </>
        )}

        <div className="flex-1 min-h-2" />

        {error && (
          <p
            role="alert"
            aria-live="polite"
            className="font-display text-center text-[11px] tracking-[0.1em]"
            style={{ color: 'var(--color-bad)' }}
          >
            {error}
          </p>
        )}

        <PlasticButton
          onClick={onSubmit}
          disabled={disabled}
          title={disabled && !submitting ? (isCreate ? 'Enter a name first' : 'Enter a name and room code') : undefined}
          color="yellow"
          className="w-full h-[60px] text-[16px] flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span
                className="inline-block w-4 h-4 rounded-full border-2 border-current border-r-transparent animate-spin"
                aria-hidden
              />
              {isCreate ? 'CREATING…' : 'JOINING…'}
            </>
          ) : (
            <>{isCreate ? 'PRESS RECORD ★' : 'PLUG IN ★'}</>
          )}
        </PlasticButton>
      </div>
    </div>
  )
}
