import type { Rectangle, ResizeOptions } from 'electron'

import { clipboard, ClipboardItem, ipcMain, nativeImage, webContents } from 'electron'

ipcMain.handle(
  'screenshot::get',
  async (event, id: number, rect: Rectangle, actualSize?: ResizeOptions) => {
    const webContent = webContents.fromId(id)
    if (webContent) {
      const image = await webContent.capturePage(rect)
      return (actualSize ? image.resize(actualSize) : image).toDataURL()
    }
    return undefined
  },
)

// Electron 44 replaced the synchronous clipboard API (`writeImage`, `writeBuffer`, ...)
// with the W3C-style async one, so images now have to be written as a `ClipboardItem`.
// That API only exists in the main process, hence the round trip from the renderer.
ipcMain.handle('screenshot::copy', async (event, dataURL: string) => {
  const image = nativeImage.createFromDataURL(dataURL)
  if (image.isEmpty()) {
    return false
  }
  const blob = new Blob([new Uint8Array(image.toPNG())], { type: 'image/png' })
  await clipboard.write([new ClipboardItem({ 'image/png': blob })])
  return true
})
