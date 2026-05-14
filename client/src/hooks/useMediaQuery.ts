import { useCallback, useSyncExternalStore } from 'react'

export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

export const useIsMobile = (): boolean => useMediaQuery('(max-width: 1023px)')
