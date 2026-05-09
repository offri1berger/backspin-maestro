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
}

// Mini card for a placed song in the horizontal timeline
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

// Read-only mini year card (exported for opponents view)
export { MiniYearCard }

// A horizontal droppable slot — thin line when inactive, expands when active
const HSlot = ({ id, isActive }: { id: number; isActive: boolean }) => {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className="shrink-0 h-[90px] flex items-center justify-center"
      style={{
        width: isActive ? 96 : 28,
        transition: 'width 0.18s ease',
      }}
    >
      {isActive ? (
        <MysteryCardFace />
      ) : (
        <div
          style={{
            width: 1,
            height: 64,
            borderLeft: `1.5px dashed ${isOver ? 'var(--color-accent)' : 'var(--color-line)'}`,
            transition: 'border-color 0.15s',
          }}
        />
      )}
    </div>
  )
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
}: Props) => {
  const isStealWindowOpen = useGameStore((s) => s.isStealWindowOpen)
  const [dragging, setDragging] = useState(false)
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)
  const [pendingPosition, setPendingPosition] = useState<number | null>(null)
  const lastEmittedSlot = useRef<number | null | undefined>(undefined)

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
      setPendingPosition(Number(over.id))
    }
  }

  // only clear the pending card once the steal window is also gone
  useEffect(() => {
    if (isWaiting && !isStealWindowOpen) setPendingPosition(null)
  }, [isWaiting, isStealWindowOpen])

  const handleConfirmPlace = () => {
    if (pendingPosition === null || !onPlace) return
    onPlace(pendingPosition)
    // don't clear pendingPosition here — keep card visible through steal window
  }

  // Read-only: compact horizontal row
  if (readOnly) {
    if (timeline.length === 0) {
      return (
        <p className="text-muted text-xs text-center py-5">
          No songs placed yet
        </p>
      )
    }
    return (
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {timeline.map((entry, i) => <MiniYearCard key={i} entry={entry} />)}
      </div>
    )
  }

  const slots = timeline.length + 1
  const hoverSlot = dragging ? dragOverSlot : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={() => setDragging(true)}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-3">
        {/* Horizontal timeline track */}
        <div
          className="relative p-[16px_12px] border border-line rounded-[20px]"
          style={{ background: 'color-mix(in oklch, var(--color-on-bg) 2%, transparent)' }}
        >
          {/* Axis line */}
          <div className="absolute left-5 right-5 top-1/2 h-px bg-line" />
          <div className="flex items-center overflow-x-auto relative pb-0.5 gap-0">
            {Array.from({ length: slots }).map((_, i) => {
              const showHover = hoverSlot === i && currentSong != null
              // pending slot: plain div with draggable card — NOT a droppable (avoids DnD removeChild crash)
              const isPendingSlot = pendingPosition === i && currentSong != null
              const showSpectator = !isMyTurn && spectatorDragSlot === i && currentSong != null
              const isActive = showHover || showSpectator

              return (
                <Fragment key={i}>
                  {isMyTurn ? (
                    isPendingSlot ? (
                      <div
                        className="shrink-0 h-[90px] flex items-center justify-center"
                        style={{ width: 96 }}
                      >
                        <SongCard draggable isWaiting={false} />
                      </div>
                    ) : (
                      <HSlot id={i} isActive={isActive} />
                    )
                  ) : (
                    // Non-interactive spectator slot
                    <div
                      className="shrink-0 h-[90px] flex items-center justify-center"
                      style={{
                        width: showSpectator ? 96 : 28,
                        transition: 'width 0.18s ease',
                      }}
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

        {/* Mystery card source — shown at bottom only before a slot is chosen; after drop it lives in the slot */}
        {isMyTurn && currentSong && !isWaiting && pendingPosition === null && (
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">
              drag · or drop onto a slot
            </span>
            <SongCard draggable isWaiting={false} />
          </div>
        )}

        {/* Lock in button after drop */}
        {isMyTurn && !isWaiting && pendingPosition !== null && (
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

        {/* Spectator mystery card */}
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
