import { useCallback, useLayoutEffect, useRef } from 'react'
import { isInGame } from 'views/utils/game-utils'

let lockedTab = false

interface UseTabKeyboardOptions {
  onCtrlTab: () => void
  onShiftTab: () => void
  onTab: () => void
  onNumberKey: (num: number) => void
}

/**
 * Registers global keyboard shortcuts for tab navigation.
 * Call the returned `register` function once (e.g. inside useEffect).
 */
export const useTabKeyboard = ({
  onCtrlTab,
  onShiftTab,
  onTab,
  onNumberKey,
}: UseTabKeyboardOptions) => {
  const registeredRef = useRef(false)
  const onCtrlTabRef = useRef(onCtrlTab)
  const onShiftTabRef = useRef(onShiftTab)
  const onTabRef = useRef(onTab)
  const onNumberKeyRef = useRef(onNumberKey)

  // Keep refs in sync with the latest callbacks after every render
  useLayoutEffect(() => {
    onCtrlTabRef.current = onCtrlTab
    onShiftTabRef.current = onShiftTab
    onTabRef.current = onTab
    onNumberKeyRef.current = onNumberKey
  })

  const register = useCallback(() => {
    if (registeredRef.current) return
    registeredRef.current = true

    window.addEventListener('keydown', async (e) => {
      const isingame = await isInGame()
      const activeTag = document.activeElement?.tagName
      if ((activeTag === 'WEBVIEW' && !isingame) || activeTag === 'INPUT') {
        return
      }
      if (e.keyCode === 9) {
        e.preventDefault()
        if (lockedTab && e.repeat) return
        lockedTab = true
        setTimeout(() => {
          lockedTab = false
        }, 200)
        if (e.ctrlKey || e.metaKey) {
          onCtrlTabRef.current()
        } else if (e.shiftKey) {
          onShiftTabRef.current()
        } else {
          onTabRef.current()
        }
      } else if (e.ctrlKey || e.metaKey) {
        if (e.keyCode >= '1'.charCodeAt(0) && e.keyCode <= '9'.charCodeAt(0)) {
          onNumberKeyRef.current(e.keyCode - 48)
        } else if (e.keyCode === '0'.charCodeAt(0)) {
          onNumberKeyRef.current(10)
        }
      }
    })
  }, [])

  return { register }
}
