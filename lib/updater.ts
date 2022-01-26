import { autoUpdater } from 'electron-updater'
import config from './config'

import Logger from 'electron-log'

autoUpdater.logger = Logger
;(autoUpdater.logger as typeof Logger).transports.file.level = 'info'

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

export const updater = autoUpdater
