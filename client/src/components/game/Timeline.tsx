import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useState } from 'react'
import type { Song, TimelineEntry } from '@hitster/shared'
import SongCard from './SongCard'
import TimelineSlot from './TimelineSlot'

interface Props {
  timeline: TimelineEntry[]
  currentSong: Song
  onPlace: (position: number) => void
  isMyTurn: boolean
  isWaiting: boolean

}

const Timeline = ({ timeline, currentSong, onPlace, isMyTurn, isWaiting }: Props) => {
  const [dragging, setDragging] = useState(false)
  const [pendingPosition, setPendingPosition] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    setDragging(false)
    const { over } = event
    if (!over) return
    setPendingPosition(Number(over.id))
  }

  const handleConfirmPlace = () => {
    if (pendingPosition === null) return
    onPlace(pendingPosition)
    setPendingPosition(null)
  }

  const slots = timeline.length + 1

  return (
    <DndContext
      sensors={sensors}
      onDragStart={() => setDragging(true)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-3">
        <p className="text-zinc-400 text-sm text-center">
          {isMyTurn ? 'drag the card to the correct spot' : 'waiting...'}
        </p>

        <div className="flex flex-col gap-1">
          {Array.from({ length: slots }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1">
              {isMyTurn && (
                <TimelineSlot id={i} isSelected={pendingPosition === i} />
              )}
              {timeline[i] && (
                <div className="bg-zinc-800 rounded-xl px-4 py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{timeline[i].song.title}</p>
                    <p className="text-zinc-400 text-xs">{timeline[i].song.artist}</p>
                  </div>
                  <span className="text-zinc-300 font-bold text-sm">{timeline[i].song.year}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {isMyTurn && (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-zinc-400 text-xs text-center mb-2">current song</p>
            <SongCard song={currentSong} draggable isWaiting={isWaiting} />
            {pendingPosition !== null && (
              <button
                onClick={handleConfirmPlace}
                className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition"
              >
                Place here
              </button>
            )}
          </div>
        )}
      </div>

      <DragOverlay>
        {dragging && <SongCard song={currentSong} draggable={false} isWaiting={isWaiting} />}
      </DragOverlay>
    </DndContext>
  )
}

export default Timeline