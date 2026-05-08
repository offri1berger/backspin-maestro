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
  <div style={{
    flexShrink: 0,
    width: 82,
    padding: '8px 8px 10px',
    borderRadius: 10,
    background: 'var(--surface)',
    color: 'var(--on-surface)',
  }}>
    <div style={{
      fontFamily: 'var(--font-display)',
      fontSize: 26, lineHeight: 1,
      color: 'var(--accent)',
      letterSpacing: '-0.02em',
    }}>{entry.song.year}</div>
    <div style={{
      fontSize: 9, fontWeight: 600, marginTop: 6,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      color: 'var(--on-surface)',
    }}>{entry.song.title}</div>
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 8,
      color: 'var(--muted)', letterSpacing: '0.05em',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      marginTop: 1,
    }}>{entry.song.artist}</div>
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
      style={{
        flexShrink: 0,
        width: isActive ? 96 : 28,
        height: 90,
        transition: 'width 0.18s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {isActive ? (
        <MysteryCardFace />
      ) : (
        <div style={{
          width: 1,
          height: 64,
          borderLeft: `1.5px dashed ${isOver ? 'var(--accent)' : 'var(--line)'}`,
          transition: 'border-color 0.15s',
        }} />
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
        <p style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
          No songs placed yet
        </p>
      )
    }
    return (
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Horizontal timeline track */}
        <div style={{
          position: 'relative',
          padding: '16px 12px',
          border: '1px solid var(--line)',
          borderRadius: 20,
          background: 'color-mix(in oklch, var(--on-bg) 2%, transparent)',
        }}>
          {/* Axis line */}
          <div style={{
            position: 'absolute', left: 20, right: 20, top: '50%',
            height: 1, background: 'var(--line)',
          }} />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            overflowX: 'auto',
            position: 'relative',
            paddingBottom: 2,
            gap: 0,
          }}>
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
                      <div style={{
                        flexShrink: 0, width: 96, height: 90,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <SongCard draggable isWaiting={false} />
                      </div>
                    ) : (
                      <HSlot id={i} isActive={isActive} />
                    )
                  ) : (
                    // Non-interactive spectator slot
                    <div style={{
                      flexShrink: 0,
                      width: showSpectator ? 96 : 28,
                      height: 90,
                      transition: 'width 0.18s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {showSpectator ? (
                        <MysteryCardFace />
                      ) : (
                        <div style={{ width: 1, height: 64, borderLeft: '1.5px dashed var(--line)' }} />
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--muted)',
            }}>drag · or drop onto a slot</span>
            <SongCard draggable isWaiting={false} />
          </div>
        )}

        {/* Lock in button after drop */}
        {isMyTurn && !isWaiting && pendingPosition !== null && (
          <button
            onClick={handleConfirmPlace}
            style={{
              width: '100%', height: 44,
              borderRadius: 999,
              background: 'var(--accent)', color: 'var(--accent-ink)',
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            Lock in placement
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {/* Spectator mystery card */}
        {!isMyTurn && currentSong && spectatorDragSlot === null && !isWaiting && (
          <div style={{ alignSelf: 'center' }}>
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
