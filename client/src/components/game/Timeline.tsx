import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { useEffect, useRef, useState } from 'react'
import type { Song, TimelineEntry } from '@hitster/shared'
import SongCard, { MysteryCardFace } from './SongCard'
import TimelineSlot from './TimelineSlot'
import socket from '../../socket'

interface Props {
  timeline: TimelineEntry[]
  currentSong?: Song
  onPlace?: (position: number) => void
  isMyTurn?: boolean
  isWaiting?: boolean
  readOnly?: boolean
  spectatorDragSlot?: number | null
}

const TimelineEntryRow = ({ entry }: { entry: TimelineEntry }) => (
  <div className="bg-zinc-800 rounded-xl px-4 py-3 flex justify-between items-center">
    <div>
      <p className="font-medium text-sm">{entry.song.title}</p>
      <p className="text-zinc-400 text-xs">{entry.song.artist}</p>
    </div>
    <span className="text-zinc-300 font-bold text-sm">{entry.song.year}</span>
  </div>
)

const Timeline = ({
  timeline,
  currentSong,
  onPlace,
  isMyTurn = false,
  isWaiting = false,
  readOnly = false,
  spectatorDragSlot = null,
}: Props) => {
  const [dragging, setDragging] = useState(false)
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)
  const [pendingPosition, setPendingPosition] = useState<number | null>(null)
  const lastEmittedSlot = useRef<number | null | undefined>(undefined)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const emitDragSlot = (slot: number | null) => {
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
    setPendingPosition(Number(over.id))
  }

  useEffect(() => {
    if (isWaiting) setPendingPosition(null)
  }, [isWaiting])

  const handleConfirmPlace = () => {
    if (pendingPosition === null || !onPlace) return
    onPlace(pendingPosition)
    setPendingPosition(null)
  }

  if (readOnly) {
    return (
      <div className="flex flex-col gap-1">
        {timeline.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-6">No songs placed yet</p>
        ) : (
          timeline.map((entry, i) => <TimelineEntryRow key={i} entry={entry} />)
        )}
      </div>
    )
  }

  const slots = timeline.length + 1
  // during active drag: hover slot drives the in-slot preview
  // after drop: pendingPosition drives it (card is "in" the slot, draggable from there)
  const hoverSlot = dragging ? dragOverSlot : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={() => setDragging(true)}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          {Array.from({ length: slots }).map((_, i) => {
            const showHoverPreview = hoverSlot === i && currentSong != null
            // after drop, the SongCard lives here (draggable), not at the bottom
            const showPendingCard = pendingPosition === i && !dragging && currentSong != null
            const spectatorPreview = !isMyTurn && spectatorDragSlot === i && currentSong != null

            return (
              <div key={i} className="flex flex-col gap-1">
                {isMyTurn ? (
                  <TimelineSlot
                    id={i}
                    isSelected={pendingPosition === i && !dragging}
                    preview={
                      showHoverPreview ? (
                        <div className="ring-2 ring-white/60 rounded-xl">
                          <MysteryCardFace />
                        </div>
                      ) : showPendingCard ? (
                        <div className="ring-2 ring-white/60 rounded-xl">
                          <SongCard draggable isWaiting={false} />
                        </div>
                      ) : undefined
                    }
                  />
                ) : (
                  spectatorPreview ? (
                    <div className="ring-2 ring-yellow-400/70 rounded-xl">
                      <MysteryCardFace />
                    </div>
                  ) : (
                    <div className="h-8 rounded-lg border-2 border-dashed border-zinc-700" />
                  )
                )}
                {timeline[i] && <TimelineEntryRow entry={timeline[i]} />}
              </div>
            )
          })}
        </div>

        {/* bottom card: only shown when card is NOT placed in a slot yet */}
        {isMyTurn && currentSong && !isWaiting && pendingPosition === null && (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-zinc-400 text-xs text-center mb-2">current song</p>
            <SongCard draggable isWaiting={false} />
          </div>
        )}

        {isMyTurn && !isWaiting && pendingPosition !== null && (
          <div className="mt-4">
            <button
              onClick={handleConfirmPlace}
              className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition"
            >
              Place here
            </button>
          </div>
        )}

        {!isMyTurn && currentSong && spectatorDragSlot === null && !isWaiting && (
          <div className="mt-4">
            <p className="text-zinc-400 text-xs text-center mb-2">current song</p>
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
