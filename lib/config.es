import { set, get, isEqual, keys } from 'lodash'
import EventEmitter from 'events'
import CSON from 'cson'
import fs from 'fs-extra'
import path from 'path-extra'
import dbg from './debug'
import defaultConfig from './default-config'
import { mergeConfig, warn } from './utils'

const { EXROOT } = global
const configPath = path.join(EXROOT, 'config.cson')

const DEFAULT_CONFIG_PATH_REGEXP = new RegExp(`^[${keys(defaultConfig).join('|')}]`)

class PoiConfig extends EventEmitter {
  constructor() {
    super()
    this.configData = {}
    try {
      fs.accessSync(configPath, fs.R_OK | fs.W_OK)
      this.configData = mergeConfig(defaultConfig, CSON.parseCSONFile(configPath))
      dbg.log(`Config loaded from: ${configPath}`)
    } catch (e) {
      dbg.log(e)
    }
    this.defaultConfigData = defaultConfig
  }

  /**
   * get a config value at give path
   * @param {String | String[]} path the given config location
   * @param value value to fallback if queried config is undefined
   */
  get = (path = '', value) => {
    if (path === '') {
      return this.configData
    }
    if (dbg.isEnabled()) {
      const stringPath = Array.isArray(path) ? path.join('.') : path
      if (
        DEFAULT_CONFIG_PATH_REGEXP.test(stringPath) &&
        value !== undefined &&
        !isEqual(get(this.defaultConfigData, path), value)
      ) {
        warn('There might be a mssing config default, check', stringPath, value)
      }
    }
    return get(this.configData, path, this.getDefault(path, value))
  }

  /**
   * get default config value at give path
   * @param {String | String[]} path the given config location
   */
  getDefault = (path = '', value) => {
    if (path === '') {
      return this.defaultConfigData
    }
    return get(this.defaultConfigData, path, value)
  }

  /**
   * set a config value at give path
   * @param {String | String[]} path the given config location
   * @param value value to overwrite, if the path belongs to poi's default config, will reset to default value
   */
  set = (path, value) => {
    if (get(this.configData, path) === value) {
      return
    }
    if (value === undefined && this.getDefault(path) !== undefined) {
      value = this.getDefault(path)
    }
    set(this.configData, path, value)
    path = Array.isArray(path) ? path.join('.') : path
    this.emit('config.set', path, value)
    this.save()
  }

  /**
   * set a config value only when it is not set (addition only)
   * @param {String | String[]} path the given config location
   * @param value value to overwrite, leaving undefined will remove the config
   */
  setDefault = (path, value) => {
    if (this.get(path) === undefined) {
      this.set(path, value)
    }
  }

  /**
   * save current config to file
   */
  save = () => {
    try {
      fs.writeFileSync(configPath, CSON.stringify(this.configData, null, 2))
    } catch (e) {
      console.warn(e)
    }
  }

  /**
   * remove a config at given path
   * @param {String | String[]} path path to remove
   */
  delete = (path) => {
    if (typeof this.get(path) !== 'undefined') {
      let p = this.configData
      const subpath = Array.isArray(path) ? path : path.split('.')
      for (const sub of subpath.slice(0, subpath.length - 1)) {
        p = p[sub]
      }
      delete p[subpath[subpath.length - 1]]
    }
  }
}

const config = new PoiConfig()
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
  if (keys(windowmode).length || keys(background).length) {
    config.set('poi.plugin', {
      windowmode,
      background,
    })
  }
}
if (!['light', 'dark'].includes(config.get('poi.appearance.theme', 'dark'))) {
  config.set('poi.appearance.theme', 'dark')
}
config.delete('poi.windowmode')
config.delete('poi.backgroundProcess')

const pair = {
  'poi.enableAvatar': 'poi.appearance.avatar',
  'poi.background': 'poi.appearance.background',
  'poi.useCustomTitleBar': 'poi.appearance.customtitlebar',
  'poi.useSVGIcon': 'poi.appearance.svgicon',
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
