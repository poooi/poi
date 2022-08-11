import { ipcMain, Rectangle, ResizeOptions, webContents } from 'electron'

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
