import { globalShortcut } from 'electron'
import config from './config'
import windowManager from './window'
import dbg from './debug'

const registerShortcut = (acc, desc, func) => {
  dbg.log(`Registering shortcut: ${acc}\t=> ${desc}`)
  try {
    globalShortcut.register(acc, func)
    return true
  } catch (err){
    console.error(`Failed to register shortcut[${acc}]: ${err}`)
    return false
  }
}

const registerBossKey = () => {
  const accelerator = config.get('poi.shortcut.bosskey', '')
  if (accelerator)
    if (!registerShortcut(accelerator, 'Boss Key', windowManager.toggleAllWindowsVisibility))
      config.set('poi.shortcut.bosskey', '')
}
const registerDevToolShortcut = () => {
  const accelerator = 'Ctrl+Shift+I'
  registerShortcut(accelerator, 'Open Focused Window Dev Tools', windowManager.openFocusedWindowDevTools)
}

export default {
  register: () => {
    if (process.platform !== 'darwin') {
      registerBossKey()
    }
    if (config.get('poi.shortcut.useGlobalDevToolShortCut', false)){
      registerDevToolShortcut()
    }
  },
  unregister: () => {
    globalShortcut.unregisterAll()
  },
}
