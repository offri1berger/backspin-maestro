import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export const useFocusTrap = <T extends HTMLElement>(active: boolean = true) => {
  const containerRef = useRef<T | null>(null)

  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    const getFocusable = (): HTMLElement[] =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter((el) => !el.hasAttribute('inert') && el.offsetParent !== null)

    const first = getFocusable()[0]
    first?.focus()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = getFocusable()
      if (focusable.length === 0) {
        e.preventDefault()
        return
      }
      const firstEl = focusable[0]
      const lastEl = focusable[focusable.length - 1]
      const activeEl = document.activeElement as HTMLElement | null
      if (e.shiftKey && activeEl === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && activeEl === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    container.addEventListener('keydown', handleKey)
    return () => {
      container.removeEventListener('keydown', handleKey)
      previouslyFocused?.focus?.()
    }
  }, [active])

  return containerRef
}
