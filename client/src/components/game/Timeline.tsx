import React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import type { Song, TimelineEntry } from '@backspin-maestro/shared'
import SongCard, { MysteryCardFace } from './SongCard'
import socket from '../../socket'
import { useGameStore } from '../../store/gameStore'
import MiniYearCard from './timeline/MiniYearCard'
import VerticalYearCard from './timeline/VerticalYearCard'
import HSlot from './timeline/HSlot'
import VSlot from './timeline/VSlot'
import { buildHint } from './timeline/buildHint'

export { MiniYearCard }

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

  const placementResult = useGameStore((s) => s.placementResult)
  // Once the round result is revealed, the song is in `timeline` (or rejected).
  // Mask the pending slot visually to avoid double-rendering it alongside the
  // newly-placed timeline entry on the same render tick.
  const visualPendingPos = placementResult ? null : pendingPos

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    // Long-press on touch so vertical scroll keeps working until the user
    // commits to a drag. Tolerance lets a slight finger wobble during the
    // hold still count as a press, not a cancel.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  const slotCount = timeline.length + 1
  const slotDescription = (i: number): string => {
    if (timeline.length === 0) return 'empty timeline'
    if (i === 0) return `before ${timeline[0].song.year}`
    if (i === timeline.length) return `after ${timeline[timeline.length - 1].song.year}`
    return `between ${timeline[i - 1].song.year} and ${timeline[i].song.year}`
  }

  const announcements: Announcements = useMemo(() => ({
    onDragStart: () => 'Picked up the mystery song card. Use arrow keys to choose a slot, then press space or enter to place.',
    onDragOver: ({ over }) => {
      if (!over) return 'Not over a slot.'
      const i = Number(over.id)
      return `Slot ${i + 1} of ${slotCount} — ${slotDescription(i)}.`
    },
    onDragEnd: ({ over }) => {
      if (!over) return 'Placement cancelled.'
      const i = Number(over.id)
      return `Selected slot ${i + 1} — ${slotDescription(i)}. Press the lock-in button to confirm.`
    },
    onDragCancel: () => 'Placement cancelled.',
  // slotDescription closes over `timeline` so we depend on that array, plus slotCount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [slotCount, timeline])

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
    setDragOverSlot((prev) => {
      if (slot !== prev && slot !== null) vibrate(4)
      return slot
    })
    emitDragSlot(slot)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDragging(false)
    setDragOverSlot(null)
    const { over } = event
    if (isMyTurn) emitDragSlot(over ? Number(over.id) : null)
    if (!over) {
      vibrate(6)
      return
    }
    vibrate(12)
    if (autoConfirm) {
      onPlace?.(Number(over.id))
    } else {
      setPending(Number(over.id))
    }
  }

  const handleDragStart = () => {
    setDragging(true)
    vibrate(8)
  }

  const handleDragCancel = () => {
    setDragging(false)
    setDragOverSlot(null)
    if (isMyTurn) emitDragSlot(null)
  }

  useEffect(() => {
    if (!placementResult) return
    const t = setTimeout(() => {
      if (isControlled) onPendingChange?.(null)
      else setPendingPositionInternal(null)
    }, 0)
    return () => clearTimeout(t)
  }, [placementResult, isControlled, onPendingChange])

  const handleConfirmPlace = () => {
    if (pendingPos === null || !onPlace) return
    onPlace(pendingPos)
  }

  if (readOnly) {
    if (timeline.length === 0) {
      return <p className="text-muted text-xs text-center py-5 font-display tracking-[0.1em]">NO SONGS PLACED YET</p>
    }
    return (
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {timeline.map((entry, i) => <MiniYearCard key={i} entry={entry} index={i} />)}
      </div>
    )
  }

  const slots = slotCount
  const hoverSlot = dragging ? dragOverSlot : null

  if (vertical) {
    const slotLabel = (i: number) =>
      i === 0 ? '← earlier' : i === slots - 1 ? 'later →' : 'drop here'

    return (
      <DndContext
        sensors={sensors}
        accessibility={{ announcements }}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex flex-col gap-2">
          {Array.from({ length: slots }).map((_, i) => {
            const isPendingSlot = visualPendingPos === i && currentSong != null
            const showSpectator = !isMyTurn && spectatorDragSlot === i && currentSong != null
            const hint = isPendingSlot ? buildHint(timeline, i) : undefined

            return (
              <React.Fragment key={i}>
                {isMyTurn ? (
                  isPendingSlot ? (
                    <SongCard draggable isWaiting={false} fullWidth hint={hint} />
                  ) : (
                    <VSlot
                      id={i}
                      label={slotLabel(i)}
                      ariaLabel={`Slot ${i + 1} of ${slots} — ${slotDescription(i)}`}
                      armed={dragging}
                    />
                  )
                ) : showSpectator ? (
                  <MysteryCardFace fullWidth />
                ) : (
                  <div
                    className="h-9 rounded-[8px]"
                    style={{ border: '2px dashed var(--color-muted-2)' }}
                  />
                )}
                {timeline[i] && <VerticalYearCard entry={timeline[i]} index={i} />}
              </React.Fragment>
            )
          })}

          {isMyTurn && currentSong && !isWaiting && pendingPos === null && (
            <div className="pt-1">
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted text-center mb-2">
                press &amp; hold · drag to a slot
              </div>
              <SongCard draggable isWaiting={false} fullWidth />
            </div>
          )}

          {!isMyTurn && currentSong && spectatorDragSlot === null && !isWaiting && (
            <MysteryCardFace fullWidth />
          )}

          {showPlaceButton && isMyTurn && !isWaiting && pendingPos !== null && (
            <button
              onClick={handleConfirmPlace}
              className="plastic-btn plastic-btn-green w-full h-12 text-[14px] flex items-center justify-center gap-2 mt-1"
            >
              ★ LOCK IT IN ★
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {dragging && (
            <div
              className="w-full -rotate-2 scale-[1.04]"
              style={{
                filter: 'drop-shadow(0 18px 32px rgba(0,0,0,0.5)) drop-shadow(0 0 24px color-mix(in srgb, var(--color-hot) 50%, transparent))',
              }}
            >
              <MysteryCardFace fullWidth />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    )
  }

  // Horizontal layout (desktop)
  return (
    <DndContext
      sensors={sensors}
      accessibility={{ announcements }}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-col gap-3">
        <div
          className="relative p-[18px_14px] rounded-[12px]"
          style={{
            background: 'linear-gradient(180deg, #28282b 0%, #1a1a1c 30%, #1a1a1c 70%, #28282b 100%)',
            border: '2px solid #0a0a0a',
            boxShadow: 'inset 0 -6px 12px rgba(0,0,0,.6), inset 0 2px 4px rgba(255,255,255,.04), 0 12px 30px rgba(0,0,0,.5)',
          }}
        >
          <div className="absolute left-5 right-5 top-1/2 h-px" style={{ background: 'rgba(255,255,255,.05)' }} />
          <div className="flex items-center overflow-x-auto relative pb-0.5 gap-0 no-scrollbar">
            {Array.from({ length: slots }).map((_, i) => {
              const showHover = hoverSlot === i && currentSong != null
              const isPendingSlot = visualPendingPos === i && currentSong != null
              const showSpectator = !isMyTurn && spectatorDragSlot === i && currentSong != null
              const isActive = showHover || showSpectator

              return (
                <React.Fragment key={i}>
                  {isMyTurn ? (
                    isPendingSlot ? (
                      <div className="shrink-0 h-[90px] w-24 flex items-center justify-center">
                        <SongCard draggable isWaiting={false} />
                      </div>
                    ) : (
                      <HSlot id={i} isActive={isActive} label={`Slot ${i + 1} of ${slots} — ${slotDescription(i)}`} />
                    )
                  ) : (
                    <div
                      className="shrink-0 h-[96px] flex items-center justify-center transition-[width] duration-[180ms] ease-in-out"
                      style={{ width: showSpectator ? 100 : 24 }}
                    >
                      {showSpectator ? (
                        <MysteryCardFace />
                      ) : (
                        <div className="w-px h-16" style={{ borderLeft: '2px dashed var(--color-muted-2)' }} />
                      )}
                    </div>
                  )}
                  {timeline[i] && <MiniYearCard entry={timeline[i]} index={i} />}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {isMyTurn && currentSong && !isWaiting && pendingPos === null && (
          <div className="flex flex-col items-center gap-2">
            <span className="font-display text-[10px] tracking-[0.15em]" style={{ color: 'var(--color-muted)' }}>
              ↓ DRAG ONTO YOUR SHELF ↓
            </span>
            <SongCard draggable isWaiting={false} />
          </div>
        )}

        {showPlaceButton && isMyTurn && !isWaiting && pendingPos !== null && (
          <button
            onClick={handleConfirmPlace}
            className="plastic-btn plastic-btn-green w-full h-12 text-[14px] flex items-center justify-center gap-2"
          >
            ★ LOCK IT IN ★
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
