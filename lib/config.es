import { set, get } from 'lodash'
import EventEmitter from 'events'
import CSON from 'cson'
import fs from 'fs-extra'
import path from 'path-extra'
import dbg from './debug'

const {ROOT, EXROOT} = global
const defaultConfigPath = path.join(ROOT, 'config.cson')
const configPath = path.join(EXROOT, 'config.cson')

class configClass extends EventEmitter {
  constructor () {
    super()
    this.configData = null
    try {
      fs.accessSync(configPath, fs.R_OK | fs.W_OK)
      this.configData = CSON.parseCSONFile(configPath)
      dbg.log(`Config loaded from: ${configPath}`)
    }
    catch (e) {
      dbg.log(e)
    }
    if (!this.configData) {
      try {
        fs.accessSync(defaultConfigPath, fs.R_OK)
        this.configData = CSON.parseCSONFile(defaultConfigPath) || {}
        dbg.log(`Config loaded from: ${defaultConfigPath}`)
      }
      catch (e) {
        this.configData = {}
        dbg.log(e)
      }
    }
  }
  get = (path, value) => {
    if (path === '') {
      return this.configData
    }
    const ret = get(this.configData, path)
    if (ret !== undefined) {
      return ret
    } else {
      return value
    }
  }
  set = (path, value) => {
    if (get(this.configData, path) === value) {
      return
    }
    set(this.configData, path, value)
    this.emit('config.set', path, value)
    this.save()
  }
  setDefault = (path, value) => {
    if (this.get(path) === undefined) {
      this.set(path, value)
    }
  }
  save = () => {
    try {
      fs.writeFileSync(configPath, CSON.stringify(this.configData, null, 2))
    }
    catch (e) {
      console.warn(e)
    }
  }
  delete = (path) => {
    if (typeof this.get(path) !== 'undefined') {
      let p = this.configData
      const subpath = path.split('.')
      for (const sub of subpath.slice(0, subpath.length - 1)) {
        p = p[sub]
      }
      delete p[subpath[subpath.length - 1]]
    }
  }
}

const config = new configClass()
config.setMaxListeners(100)

export default config



// polyfill for old configs
if (typeof config.get('poi.layout') === 'string') {
  const mode = config.get('poi.layout')
  config.set('poi.layout', {
    mode,
  })
}
if (!config.get('poi.plugin')) {
  const windowmode = config.get('poi.windowmode', {})
  const background = config.get('poi.backgroundProcess', {})
  if (Object.keys(windowmode).length || Object.keys(background).length) {
    config.set('poi.plugin', {
      windowmode,
      background,
    })
  }
}
config.delete('poi.windowmode')
config.delete('poi.backgroundProcess')

const pair = {
  'poi.enableAvatar': 'poi.appearance.avatar',
  'poi.background': 'poi.appearance.background',
  'poi.useCustomTitleBar': 'poi.appearance.customtitlebar',
  'poi.useSVGIcon': 'poi.appearance.svgicon',
  'poi.useQuestContents': 'poi.appearance.questcontents',
  'poi.textSpacingCJK': 'poi.appearance.textspacingcjk',
  'poi.layouteditable': 'poi.layout.editable',
  'poi.vibrant': 'poi.appearance.vibrant',
  'poi.isolateGameWindow': 'poi.layout.isolate',
  'poi.overlayPanel': 'poi.layout.overlay',
  'poi.panel': 'poi.layout.overlaypanel',
  'poi.theme': 'poi.appearance.theme',
  'poi.zoomLevel': 'poi.appearance.zoom',
  'poi.asyncMode': 'poi.misc.async',
  'poi.sendAnalytics': 'poi.misc.analytics',
  'poi.language': 'poi.misc.language',
  'poi.first': 'poi.update.lastversion',
  'poi.showNetworkLog': 'poi.misc.networklog',
  'poi.homepage': 'poi.misc.homepage',
  'poi.disableHA': 'poi.misc.disablehwaccel',
  'poi.disableNetworkAlert': 'poi.misc.disablenetworkalert',
  'poi.enterSafeMode': 'poi.misc.safemode',
  'poi.screenshotFormat': 'poi.misc.screenshot.format',
  'poi.screenshotPath': 'poi.misc.screenshot.path',
  'poi.createShortcut': 'poi.misc.shortcut',
  'poi.delayItemDevResult': 'poi.notify.delay.dev',
  'poi.delayItemImproveResult': 'poi.notify.delay.improve',
  'poi.betaChannel': 'poi.update.beta',
  'poi.cachePath': 'poi.misc.cache.path',
  'poi.cacheSize': 'poi.misc.cache.size',
  'poi.reverseLayout': 'poi.layout.reverse',
  'poi.enableDMMcookie': 'poi.misc.dmmcookie',
}

for (const [orig, next] of Object.entries(pair)) {
  if (typeof config.get(orig) !== 'undefined') {
    config.set(next, config.get(orig))
    config.delete(orig)
  }
}

config.save()
