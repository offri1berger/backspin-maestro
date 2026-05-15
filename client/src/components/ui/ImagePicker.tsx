import { useEffect, useState } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import PolaroidAvatar from '../boombox/PolaroidAvatar'
import Sticker from '../boombox/Sticker'
import PlasticButton from '../boombox/PlasticButton'

interface Props {
  options: string[]
  value: string | undefined
  onChange: (value: string | undefined) => void
  fallback?: React.ReactNode
  label?: string
}

const ImagePicker = ({ options, value, onChange, fallback = '?', label = 'image' }: Props) => {
  const [showModal, setShowModal] = useState(false)
  const [pending, setPending] = useState<string | undefined>(undefined)
  const trapRef = useFocusTrap<HTMLDivElement>(showModal)

  const open = () => {
    setPending(value)
    setShowModal(true)
  }

  const save = () => {
    onChange(pending)
    setShowModal(false)
  }

  const remove = () => {
    onChange(undefined)
    setShowModal(false)
  }

  useEffect(() => {
    if (!showModal) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [showModal])

  const fallbackString = typeof fallback === 'string' ? fallback : '?'

  return (
    <>
      {/* Preview polaroid + trigger */}
      <div className="flex flex-col items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={open}
          aria-label={`Pick ${label}`}
          className="bg-transparent border-0 p-0 cursor-pointer"
        >
          <PolaroidAvatar
            src={value}
            fallback={fallbackString}
            size={76}
            rotate={-5}
            active
          />
        </button>
        {options.length > 0 && (
          <button
            type="button"
            onClick={open}
            className="font-display text-[10px] tracking-[0.05em] uppercase cursor-pointer bg-transparent border-0 p-0 text-hot"
          >
            {value ? 'CHANGE ★' : 'PICK FACE ★'}
          </button>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-[rgba(0,0,0,0.72)] backdrop-blur-[8px]"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Choose ${label}`}
            className="brushed-dark panel-hardware w-full max-w-2xl flex flex-col max-h-[88vh]"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-[#0a0a0a]">
              <Sticker color="hot" rotate={-3}>★ PICK A STAR</Sticker>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close"
                className="w-9 h-9 rounded-md cursor-pointer flex items-center justify-center bg-[#1a1a1c] border-2 border-black text-cream"
              >✕</button>
            </div>

            <div
              className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 grid content-start gap-3 [grid-template-columns:repeat(auto-fill,minmax(88px,1fr))]"
            >
              {options.map((src) => {
                const selected = pending === src
                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setPending(src)}
                    className={`aspect-square p-1 cursor-pointer rounded bg-cream border-2 border-black ${selected ? 'opacity-100 [box-shadow:0_0_0_2px_var(--color-hot),0_0_12px_color-mix(in_srgb,var(--color-hot)_50%,transparent),0_2px_4px_rgba(0,0,0,.4)]' : 'opacity-[.85] [box-shadow:0_2px_4px_rgba(0,0,0,.4)]'}`}
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover block [filter:brightness(1.08)_saturate(1.15)]"
                    />
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3 px-5 py-4 border-t-2 border-[#0a0a0a]">
              <PlasticButton
                onClick={remove}
                color="dark"
                className="flex-1 h-12 text-[11px]"
              >
                REMOVE
              </PlasticButton>
              <PlasticButton
                onClick={save}
                color="yellow"
                className="flex-1 h-12 text-[12px]"
              >
                SAVE ★
              </PlasticButton>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ImagePicker
