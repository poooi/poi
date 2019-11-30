import { autoUpdater } from 'electron-updater'
import config from './config'

if (process.platform === 'win32') {
  autoUpdater.logger = require('electron-log')
  autoUpdater.logger.transports.file.level = 'info'

  autoUpdater.setFeedURL({
    provider: 'generic',
    url: 'https://poi.moe/dist',
    channel: config.get('poi.update.beta', false) ? 'beta' : 'latest',
  })
  autoUpdater.autoDownload = false
}

export function changeChannel(channel) {
  if (process.platform !== 'darwin') {
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: 'https://poi.moe/dist',
      channel,
    })
  }
}

export const updater = autoUpdater
