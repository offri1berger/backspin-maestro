import { Fragment, useEffect, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import type { Song, TimelineEntry } from '@hitster/shared'
import SongCard, { MysteryCardFace } from './SongCard'
import socket from '../../socket'
import { useGameStore } from '../../store/gameStore'

interface Props {
  timeline: TimelineEntry[]
  currentSong?: Song
  onPlace?: (position: number) => void
  isMyTurn?: boolean
  isWaiting?: boolean
  readOnly?: boolean
  spectatorDragSlot?: number | null
  broadcastDrag?: boolean
  autoConfirm?: boolean
  vertical?: boolean
  pendingPosition?: number | null
  onPendingChange?: (pos: number | null) => void
  showPlaceButton?: boolean
}

// Mini card — horizontal desktop timeline
const MiniYearCard = ({ entry }: { entry: TimelineEntry }) => (
  <div className="shrink-0 w-[82px] p-[8px_8px_10px] rounded-[10px] bg-surface text-on-surface">
    <div className="font-display text-[26px] leading-none text-accent tracking-[-0.02em]">
      {entry.song.year}
    </div>
    <div className="text-[9px] font-semibold mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis text-on-surface">
      {entry.song.title}
    </div>
    <div className="font-mono text-[8px] text-muted tracking-[0.05em] whitespace-nowrap overflow-hidden text-ellipsis mt-px">
      {entry.song.artist}
    </div>
  </div>
)

export { MiniYearCard }

// Full-width year card — vertical mobile timeline (matches design .year-card)
const VerticalYearCard = ({ entry }: { entry: TimelineEntry }) => (
  <div
    style={{
      background: 'var(--color-surface)',
      color: 'var(--color-on-surface)',
      borderRadius: 18,
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      overflow: 'hidden',
      minHeight: 68,
    }}
  >
    <div
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 38,
        lineHeight: 1,
        letterSpacing: '-0.03em',
        color: 'var(--color-accent)',
        flexShrink: 0,
        width: 86,
      }}
    >
      {entry.song.year}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {entry.song.title}
      </div>
      <div
        style={{
          fontSize: 12, color: 'var(--color-muted)',
          fontFamily: 'var(--font-mono)', letterSpacing: '0.02em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginTop: 2,
        }}
      >
        {entry.song.artist}
      </div>
    </div>
  </div>
)

// Horizontal drop slot — desktop
const HSlot = ({ id, isActive }: { id: number; isActive: boolean }) => {
  const { isOver, setNodeRef } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className="shrink-0 h-[90px] flex items-center justify-center"
      style={{ width: isActive ? 96 : 28, transition: 'width 0.18s ease' }}
    >
      {isActive ? (
        <MysteryCardFace />
      ) : (
        <div
          style={{
            width: 1, height: 64,
            borderLeft: `1.5px dashed ${isOver ? 'var(--color-accent)' : 'var(--color-line)'}`,
            transition: 'border-color 0.15s',
          }}
        />
      )}
    </div>
  )
}

// Vertical drop slot — mobile. Height is ALWAYS 36px — no layout shift during drag.
const VSlot = ({ id, label }: { id: number; label: string }) => {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className="w-full flex items-center justify-center"
      style={{
        height: 36,
        borderRadius: 10,
        border: `1.5px dashed ${isOver ? 'var(--color-accent)' : 'var(--color-line)'}`,
        background: isOver ? 'color-mix(in oklch, var(--color-accent) 14%, transparent)' : 'transparent',
        transition: 'border-color 0.15s, background 0.15s',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.15em',
        textTransform: 'uppercase' as const,
        color: isOver ? 'var(--color-accent)' : 'var(--color-muted-2)',
      }}
    >
      {label}
    </div>
  )
}

// Build the placement hint shown on the mystery card face
function buildHint(timeline: TimelineEntry[], pos: number): string {
  const left = pos > 0 ? timeline[pos - 1]?.song.year : undefined
  const right = timeline[pos]?.song.year
  const fmt = (y: number) => `'${String(y).slice(2)}`
  if (left && right) return `Place between ${fmt(left)} and ${fmt(right)}`
  if (left) return `Place after ${fmt(left)}`
  if (right) return `Place before ${fmt(right)}`
  return 'Place anywhere'
}

const Timeline = ({
  timeline,
  currentSong,
  onPlace,
  isMyTurn = false,
  isWaiting = false,
  readOnly = false,
  spectatorDragSlot = null,
  broadcastDrag = true,
  autoConfirm = false,
  vertical = false,
  pendingPosition: controlledPending,
  onPendingChange,
  showPlaceButton = true,
}: Props) => {
  const isStealWindowOpen = useGameStore((s) => s.isStealWindowOpen)
  const [dragging, setDragging] = useState(false)
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)
  const [pendingPositionInternal, setPendingPositionInternal] = useState<number | null>(null)
  const lastEmittedSlot = useRef<number | null | undefined>(undefined)

  const isControlled = controlledPending !== undefined
  const pendingPos = isControlled ? controlledPending : pendingPositionInternal
  const setPending = (pos: number | null) => {
    if (isControlled) onPendingChange?.(pos)
    else setPendingPositionInternal(pos)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const emitDragSlot = (slot: number | null) => {
    if (!broadcastDrag) return
    if (slot !== lastEmittedSlot.current) {
      lastEmittedSlot.current = slot
      socket.emit('drag:move', { slot })
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    if (!isMyTurn) return
    const slot = event.over ? Number(event.over.id) : null
    setDragOverSlot(slot)
    emitDragSlot(slot)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDragging(false)
    setDragOverSlot(null)
    const { over } = event
    if (isMyTurn) emitDragSlot(over ? Number(over.id) : null)
    if (!over) return
    if (autoConfirm) {
      onPlace?.(Number(over.id))
    } else {
      setPending(Number(over.id))
    }
  }

  useEffect(() => {
    if (isWaiting && !isStealWindowOpen) setPending(null)
  }, [isWaiting, isStealWindowOpen])

  const handleConfirmPlace = () => {
    if (pendingPos === null || !onPlace) return
    onPlace(pendingPos)
  }

  if (readOnly) {
    if (timeline.length === 0) {
      return <p className="text-muted text-xs text-center py-5">No songs placed yet</p>
    }
    return (
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {timeline.map((entry, i) => <MiniYearCard key={i} entry={entry} />)}
      </div>
    )
  }

  const slots = timeline.length + 1
  const hoverSlot = dragging ? dragOverSlot : null

  // ── Vertical layout (mobile) ──────────────────────────────────────────────
  if (vertical) {
    const slotLabel = (i: number) =>
      i === 0 ? '← earlier' : i === slots - 1 ? 'later →' : 'drop here'

    return (
      <DndContext
        sensors={sensors}
        onDragStart={() => setDragging(true)}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col gap-2">
          {Array.from({ length: slots }).map((_, i) => {
            const isPendingSlot = pendingPos === i && currentSong != null
            const showSpectator = !isMyTurn && spectatorDragSlot === i && currentSong != null
            const hint = isPendingSlot ? buildHint(timeline, i) : undefined

            return (
              <Fragment key={i}>
                {isMyTurn ? (
                  isPendingSlot ? (
                    // Card dropped here — show mystery card in place
                    <SongCard draggable isWaiting={false} fullWidth hint={hint} />
                  ) : (
                    <VSlot id={i} label={slotLabel(i)} />
                  )
                ) : (
                  // Spectator view — fixed height, color-only feedback, no layout shift
                  <div
                    style={{
                      height: 36, borderRadius: 10,
                      border: `1.5px dashed ${showSpectator ? 'var(--color-accent)' : 'var(--color-line)'}`,
                      background: showSpectator ? 'color-mix(in oklch, var(--color-accent) 14%, transparent)' : 'transparent',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  />
                )}
                {timeline[i] && <VerticalYearCard entry={timeline[i]} />}
              </Fragment>
            )
          })}

          {/* Draggable source card (before any slot is chosen) */}
          {isMyTurn && currentSong && !isWaiting && pendingPos === null && (
            <div className="pt-1">
              <div
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'var(--color-muted)', textAlign: 'center', marginBottom: 8,
                }}
              >
                drag to a slot to place
              </div>
              <SongCard draggable isWaiting={false} fullWidth />
            </div>
          )}

          {/* Spectator waiting */}
          {!isMyTurn && currentSong && spectatorDragSlot === null && !isWaiting && (
            <MysteryCardFace fullWidth />
          )}
        </div>

        <DragOverlay>
          {dragging && (
            <div style={{ transform: 'scale(1.08)', transformOrigin: 'center' }}>
              <MysteryCardFace />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    )
  }

  // ── Horizontal layout (desktop) ───────────────────────────────────────────
  return (
    <DndContext
      sensors={sensors}
      onDragStart={() => setDragging(true)}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-3">
        <div
          className="relative p-[16px_12px] border border-line rounded-[20px]"
          style={{ background: 'color-mix(in oklch, var(--color-on-bg) 2%, transparent)' }}
        >
          <div className="absolute left-5 right-5 top-1/2 h-px bg-line" />
          <div className="flex items-center overflow-x-auto relative pb-0.5 gap-0">
            {Array.from({ length: slots }).map((_, i) => {
              const showHover = hoverSlot === i && currentSong != null
              const isPendingSlot = pendingPos === i && currentSong != null
              const showSpectator = !isMyTurn && spectatorDragSlot === i && currentSong != null
              const isActive = showHover || showSpectator

              return (
                <Fragment key={i}>
                  {isMyTurn ? (
                    isPendingSlot ? (
                      <div className="shrink-0 h-[90px] flex items-center justify-center" style={{ width: 96 }}>
                        <SongCard draggable isWaiting={false} />
                      </div>
                    ) : (
                      <HSlot id={i} isActive={isActive} />
                    )
                  ) : (
                    <div
                      className="shrink-0 h-[90px] flex items-center justify-center"
                      style={{ width: showSpectator ? 96 : 28, transition: 'width 0.18s ease' }}
                    >
                      {showSpectator ? (
                        <MysteryCardFace />
                      ) : (
                        <div style={{ width: 1, height: 64, borderLeft: '1.5px dashed var(--color-line)' }} />
                      )}
                    </div>
                  )}
                  {timeline[i] && <MiniYearCard entry={timeline[i]} />}
                </Fragment>
              )
            })}
          </div>
        </div>

        {isMyTurn && currentSong && !isWaiting && pendingPos === null && (
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">
              drag · or drop onto a slot
            </span>
            <SongCard draggable isWaiting={false} />
          </div>
        )}

        {showPlaceButton && isMyTurn && !isWaiting && pendingPos !== null && (
          <button
            onClick={handleConfirmPlace}
            className="w-full h-11 rounded-full bg-accent text-accent-ink border-0 cursor-pointer font-body font-semibold text-sm flex items-center justify-center gap-2"
          >
            Lock in placement
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {!isMyTurn && currentSong && spectatorDragSlot === null && !isWaiting && (
          <div className="self-center">
            <MysteryCardFace />
          </div>
        )}
      </div>

      <DragOverlay>
        {dragging && <MysteryCardFace />}
      </DragOverlay>
    </DndContext>
  )
}

export default Timeline
