import { clipboard, ClipboardItem, ipcMain, nativeImage } from 'electron'

// Electron 44 removed the `clipboard` module from the renderer process and replaced the
// synchronous main-process API (`writeText`, `writeImage`, ...) with the W3C-style async
// one, so every renderer clipboard write now has to round-trip through the main process.

ipcMain.handle('clipboard::write-text', async (event, text: string) => {
  await clipboard.writeText(text)
  return true
})

ipcMain.handle('clipboard::write-image', async (event, dataURL: string) => {
  const image = nativeImage.createFromDataURL(dataURL)
  if (image.isEmpty()) {
    return false
  }
  const blob = new Blob([new Uint8Array(image.toPNG())], { type: 'image/png' })
  await clipboard.write([new ClipboardItem({ 'image/png': blob })])
  return true
})
