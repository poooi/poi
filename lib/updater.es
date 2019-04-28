import { autoUpdater } from 'electron-updater'
import config from './config'

autoUpdater.logger = require('electron-log')
autoUpdater.logger.transports.file.level = 'info'

autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://poi.moe/dist',
  channel: config.get('poi.update.beta', false) ? 'beta' : 'latest',
})
autoUpdater.autoDownload = false

export function changeChannel(channel) {
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: 'https://poi.moe/dist',
    channel,
  })
  autoUpdater.autoDownload = false
}

export const updater = autoUpdater
