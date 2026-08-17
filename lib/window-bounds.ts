import type { BrowserWindow, Rectangle } from 'electron'

import { debounce } from 'lodash'

// Moving / resizing a window emits a burst of events, and every write hits the
// config file synchronously, so only the last change of a gesture is persisted.
const SAVE_DELAY = 1000

export interface WindowBoundsState extends Rectangle {
  isMaximized: boolean
  isFullScreen: boolean
}

/**
 * Persist a window's bounds whenever the user moves, resizes, maximizes or
 * fullscreens it.
 *
 * The reported rectangle is `getNormalBounds()`, i.e. the bounds the window will
 * be restored to, so a maximized / fullscreen window keeps its restore geometry
 * alongside the flags.
 *
 * @returns a disposer that flushes any pending write and detaches the listeners
 */
export const watchWindowBounds = (
  win: BrowserWindow,
  save: (state: WindowBoundsState) => void,
): (() => void) => {
  const handleBoundsChange = debounce(() => {
    if (win.isDestroyed()) {
      return
    }
    try {
      save({
        ...win.getNormalBounds(),
        isMaximized: win.isMaximized(),
        isFullScreen: win.isFullScreen(),
      })
    } catch (e) {
      console.error(e)
    }
  }, SAVE_DELAY)

  const flush = () => {
    handleBoundsChange.flush()
  }

  win.on('move', handleBoundsChange)
  win.on('resize', handleBoundsChange)
  // Bounds don't change when only the maximized / fullscreen flag flips
  win.on('maximize', handleBoundsChange)
  win.on('unmaximize', handleBoundsChange)
  win.on('enter-full-screen', handleBoundsChange)
  win.on('leave-full-screen', handleBoundsChange)
  // The window is still alive on 'close', so a pending write can be flushed here
  win.on('close', flush)

  return () => {
    flush()
    if (!win.isDestroyed()) {
      win.off('move', handleBoundsChange)
      win.off('resize', handleBoundsChange)
      win.off('maximize', handleBoundsChange)
      win.off('unmaximize', handleBoundsChange)
      win.off('enter-full-screen', handleBoundsChange)
      win.off('leave-full-screen', handleBoundsChange)
      win.off('close', flush)
    }
  }
}

/**
 * Apply a previously saved maximized / fullscreen state to a freshly opened
 * window. Bounds themselves are restored through the window's creation options.
 */
export const restoreWindowState = (
  win: BrowserWindow,
  state: Partial<Pick<WindowBoundsState, 'isMaximized' | 'isFullScreen'>> | undefined,
): void => {
  if (!state || win.isDestroyed()) {
    return
  }
  if (state.isFullScreen && win.isFullScreenable()) {
    win.setFullScreen(true)
  } else if (state.isMaximized && win.isMaximizable()) {
    win.maximize()
  }
}
