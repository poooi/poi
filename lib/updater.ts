import Logger from 'electron-log'
import { autoUpdater } from 'electron-updater'

import config from './config'

autoUpdater.logger = Logger
Logger.transports.file.level = 'info'

autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://update.poi.moe/dist',
  channel: config.get('poi.update.beta', false) ? 'beta' : 'latest',
})
autoUpdater.autoDownload = false

export function changeChannel(channel: string) {
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: 'https://update.poi.moe/dist',
    channel,
  })
  autoUpdater.autoDownload = false
}
export type ChangeChannel = typeof changeChannel

export const updater = autoUpdater
export type Updater = typeof autoUpdater
