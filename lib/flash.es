import { app } from 'electron'
import { warn } from './utils'

try {
  const path = app.getPath('pepperFlashSystemPlugin')
  app.commandLine.appendSwitch('ppapi-flash-path', path)
} catch (e) {
  warn('Cannot get system flash plugin path')
}

