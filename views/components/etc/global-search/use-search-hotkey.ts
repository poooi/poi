import { useEffect, useRef } from 'react'

import { matchesAccelerator } from './accelerator'

/**
 * Fires `onTrigger` when the configured accelerator is pressed anywhere in the
 * poi window. Typing inside a text field is left alone unless the shortcut
 * carries a modifier, so the default Ctrl/Cmd+F still works from the search
 * input itself.
 */
export const useSearchHotkey = (accelerator: string, onTrigger: () => void) => {
  const onTriggerRef = useRef(onTrigger)
  // eslint-disable-next-line react-hooks/refs
  onTriggerRef.current = onTrigger

  useEffect(() => {
    if (!accelerator) return
    const handleKeyDown = (e: KeyboardEvent) => {
      const bare = !e.ctrlKey && !e.metaKey && !e.altKey
      const activeTag = document.activeElement?.tagName
      if (bare && (activeTag === 'INPUT' || activeTag === 'TEXTAREA')) return
      if (!matchesAccelerator(e, accelerator)) return
      e.preventDefault()
      onTriggerRef.current()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [accelerator])
}
