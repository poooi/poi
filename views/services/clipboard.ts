import { ipcRenderer } from 'electron'

// Electron 44 dropped the renderer-side `clipboard` module; the main process owns the
// clipboard now, so these helpers exist to keep call sites from reaching for it.

export const writeClipboardText = async (text: string): Promise<boolean> =>
  ipcRenderer.invoke('clipboard::write-text', text)

export const writeClipboardImage = async (dataURL: string): Promise<boolean> =>
  ipcRenderer.invoke('clipboard::write-image', dataURL)

// For call sites that cannot await, e.g. click handlers on the plugin crash dialog.
// The IPC rejects if the main handler throws or is gone, so never leave it unhandled.
export const copyText = (text: string): void => {
  writeClipboardText(text).catch((err: unknown) => {
    console.error('Failed to write text to the clipboard', err)
  })
}
