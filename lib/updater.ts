import type { ElectronLog } from 'electron-log'

import Logger from 'electron-log'
import { autoUpdater } from 'electron-updater'

import config from './config'

autoUpdater.logger = Logger
const logger = autoUpdater.logger satisfies ElectronLog
logger.transports.file.level = 'info'

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
