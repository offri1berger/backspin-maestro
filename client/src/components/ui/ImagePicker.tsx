import { useState } from 'react'

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

  return (
    <>
      {/* Preview bubble + trigger */}
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
        <div
          className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center font-display text-[28px]"
          style={{ background: 'var(--color-line, #e0d8ce)', color: 'var(--color-on-bg)' }}
        >
          {value
            ? <img src={value} alt="" className="w-full h-full object-cover" />
            : fallback
          }
        </div>
        {options.length > 0 && (
          <button
            type="button"
            onClick={open}
            className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent cursor-pointer bg-transparent border-none p-0 hover:opacity-70 transition-opacity"
          >
            {value ? 'change' : 'pick'}
          </button>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{ background: 'rgba(0,0,0,0.6)' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div
            className="bg-bg-2 border border-line rounded-2xl w-full max-w-sm flex flex-col"
            style={{ maxHeight: '80vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-line flex-shrink-0">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">
                Choose {label}
              </span>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-7 h-7 flex items-center justify-center bg-transparent border-none cursor-pointer text-muted hover:text-on-bg transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Grid */}
            <div className="overflow-y-auto p-6 grid grid-cols-4 gap-3">
              {options.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setPending(src)}
                  className="aspect-square rounded-full p-0 border-none bg-transparent cursor-pointer overflow-hidden"
                  style={{
                    outline: pending === src ? '3px solid var(--color-accent)' : '3px solid transparent',
                    outlineOffset: 2,
                  }}
                >
                  <img src={src} alt="" className="w-full h-full object-cover block" />
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-5 border-t border-line flex-shrink-0">
              <button
                type="button"
                onClick={remove}
                className="flex-1 h-11 rounded-full border border-line bg-transparent text-on-bg font-mono text-[11px] tracking-[0.15em] uppercase cursor-pointer hover:border-accent transition-colors"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={save}
                className="flex-1 h-11 rounded-full bg-accent text-accent-ink border-none font-mono text-[11px] tracking-[0.15em] uppercase font-bold cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ImagePicker
