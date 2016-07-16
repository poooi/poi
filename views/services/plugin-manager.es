import path from 'path-extra'
import semver from 'semver'
import EventEmitter from 'events'
import React from 'react'
import { remote } from 'electron'
import { sortBy, get, set } from 'lodash'
import fs from 'fs-extra'
import glob from 'glob'
import request from 'request'
import npm from 'npm'
import { promisify, promisifyAll } from 'bluebird'
import FontAwesome from 'react-fontawesome'

const __ = window.i18n.setting.__.bind(window.i18n.setting)
const {config, language, notify, proxy, ROOT, PLUGIN_PATH} = window
const requestAsync = promisify(promisifyAll(request), {multiArgs: true})

const windowManager = remote.require('./lib/window')
const utils = remote.require('./lib/utils')

const envKeyList = ['_teitokuLv', '_nickName', '_nickNameId', '_teitokuExp', '_teitokuId', '_slotitems', '_ships', '_decks', '_ndocks']

class PluginManager extends EventEmitter {
  constructor(packagePath, pluginPath, mirrorPath) {
    super(packagePath, pluginPath, mirrorPath)
    this.packagePath = packagePath
    this.pluginPath = pluginPath
    this.mirrorPath = mirrorPath
    this.requirements = null
    this.plugins = null
    this.mirrors = null
    this.config = {
      production: true,
      mirror: null,
      proxy: null,
      betaCheck: null,
    }
    this.npmConfig = {
      prefix: this.pluginPath,
      registry: "https://registry.npmjs.org",
      progress: false,
    }
    this.VALID = 0
    this.DISABLED = 1
    this.NEEDUPDATE = 2
    this.BROKEN = 3
  }
  readPackage() {
    return this.requirements = fs.readJsonSync(this.packagePath)
  }
  async readPlugins() {
    const pluginPaths = glob.sync(path.join(this.pluginPath, 'node_modules', 'poi-plugin-*'))
    this.plugins = pluginPaths.map(this.readPlugin)
    for (const i in this.plugins) {
      const plugin = this.plugins[i]
      if (plugin.enabled) {
        this.loadPlugin(plugin)
      }
    }
    this.notifyFailed()
    this.plugins = sortBy(this.plugins, 'priority')
    return this.plugins
  }
  getRequirements() {
    if (this.requirements != null)
      return this.requirements
    else {
      return this.readPackage()
    }
  }
  async getMirrors() {
    if (this.mirrors != null) {
      return Promise.resolve(this.mirrors)
    } else {
      return await this.readMirrors()
    }
  }
  async readMirrors() {
    this.mirrors = fs.readJsonSync(this.mirrorPath)
    const mirrorConf = config.get('packageManager.mirrorName', (navigator.language === 'zh-CN') ?  "taobao" : "npm")
    const proxyConf = config.get("packageManager.proxy", false)
    const betaCheck = config.get("packageManager.enableBetaPluginCheck", false)
    await this.selectConfig(mirrorConf, proxyConf, betaCheck)
    return this.mirrors
  }
  async selectConfig(name, enable, check) {
    await this.getMirrors()
    if (name) {
      this.config.mirror = this.mirrors[name]
      config.set("packageManager.mirrorName", name)
    }
    if (enable) {
      this.config.proxy = enable
      config.set("packageManager.proxy", enable)
    }
    if (check) {
      this.config.betaCheck = check
      config.set("packageManager.enableBetaPluginCheck", check)
    }
    this.npmConfig.registry = this.config.mirror.server
    if (this.config.proxy) {
      const {port} = proxy
      this.npmConfig.http_proxy = `http://127.0.0.1:${port}`
    } else {
      if (this.npmConfig.http_proxy) {
        delete this.npmConfig.http_proxy
      }
    }
    await promisify(npm.load)(this.npmConfig)
    return this.config
  }
  isMetRequirement(plugin) {
    let lowest
    if (!plugin.isRead) {
      return false
    }
    if ((this.requirements[plugin.packageName] || {}).version) {
      lowest = this.requirements[plugin.packageName].version
    } else {
      lowest = 'v0.0.0'
    }
    return semver.gte(plugin.packageData.version, lowest)
  }
  isEnabled(plugin) {
    if (!plugin.isRead) {
      return false
    }
    return plugin.enabled
  }
  isValid(plugin) {
    if (!plugin.isRead) {
      return false
    }
    if (!plugin.isInstalled) {
      return false
    }
    if (!this.isEnabled(plugin)) {
      return false
    }
    return this.isMetRequirement(plugin)
  }
  getStatusOfPlugin(plugin) {
    if (plugin.isBroken || plugin.needRollback) {
      return this.BROKEN
    }
    if (!plugin.isRead) {
      return this.DISABLED
    }
    if (!this.isMetRequirement(plugin)) {
      return this.NEEDUPDATE
    }
    if (!this.isEnabled(plugin)) {
      return this.DISABLED
    }
    return this.VALID
  }
  getPlugins() {
    if (this.plugins) {
      return Promise.resolve(this.plugins)
    }
    else {
      return this.readPlugins()
    }
  }
  async getConf() {
    await this.getMirrors()
    return Promise.resolve(this.config)
  }
  getInstalledPlugins() {
    return this.getFilteredPlugins((plugin) => (plugin.isInstalled))
  }
  async getUninstalledPluginSettings() {
    this.getRequirements()
    const installedPlugins = await this.getInstalledPlugins()
    const installedPluginNames = installedPlugins.map((plugin) => (plugin.packageName))
    const uninstalled = {}
    for (const name in this.requirements) {
      const value = this.requirements[name]
      if (installedPluginNames.indexOf(name) === -1) {
        uninstalled[name] = value
      }
    }
    return uninstalled
  }
  getReadPlugins() {
    return this.getFilteredPlugins((plugin) => (plugin.isRead))
  }
  getUnreadPlugins() {
    return this.getFilteredPlugins((plugin) => (!plugin.isRead))
  }
  getBrokenPlugins() {
    return this.getFilteredPlugins((plugin) => (plugin.isBroken))
  }
  getValidPlugins() {
    return this.getFilteredPlugins(this.isValid.bind(this))
  }
  getMetRequirementPlugins() {
    return this.getFilteredPlugins(this.isMetRequirement.bind(this))
  }
  getUpdateStatus () {
    for (const i in this.plugins) {
      if (this.plugins[i].isOutdated) {
        return true
      }
    }
    return false
  }
  async getOutdatedPlugins (isNotif) {
    await this.getMirrors()
    const plugins = await this.getInstalledPlugins()
    const outdatedPlugins = []
    const outdatedList = []
    const tasks = plugins.map(async function (plugin, index) {
      if (!plugin.needRollback) {
        try {
          const data = JSON.parse((await requestAsync(`${this.config.mirror.server}${plugin.packageName}/latest`))[1])
          const distTag = {
            latest: data.version,
          }
          if (this.config.betaCheck) {
            const betaData = JSON.parse((await requestAsync(`${this.config.mirror.server}${plugin.packageName}/beta`))[1])
            Object.assign(distTag, {
              beta: betaData.version,
            })
          }
          let latest = `${plugin.version}`
          let notCompatible = false
          const apiVer = (data.poiPlugin || {}).apiVer || plugin.apiVer
          let nearestCompVer = 'v214.748.3647'
          for (const mainVersion in apiVer) {
            if (semver.lte(window.POI_VERSION, mainVersion) && semver.lt(mainVersion, nearestCompVer)) {
              notCompatible = true
              nearestCompVer = mainVersion
              latest = plugin.apiVer[mainVersion]
            }
          }
          if (!notCompatible && this.config.betaCheck && distTag.beta) {
            if (semver.gt(distTag.beta, latest)) {
              latest = distTag.beta
            }
          }
          if (!notCompatible && semver.gt(distTag.latest, latest)) {
            latest = distTag.latest
          }
          if (semver.gt(latest, plugin.version)) {
            outdatedPlugins.push(plugin)
            this.plugins[index].isOutdated = true
            this.plugins[index].lastestVersion = latest
            if (plugin.isRead) {
              outdatedList.push(plugin.name)
            }
          }
        } catch (e) {
          console.error(e)
        }
      }
    }, this)
    await Promise.all(tasks)
    if (isNotif && outdatedList.length > 0) {
      const content = `${outdatedList.join(' ')} ${__("have newer version. Please update your plugins.")}`
      notify(content, {
        type: 'plugin update',
        title: __('Plugin update'),
        icon: path.join(ROOT, 'assets', 'img', 'material', '7_big.png'),
        audio: `file://${ROOT}/assets/audio/update.mp3`,
      })
    }
    return outdatedPlugins
  }
  async getFilteredPlugins(filter) {
    this.getRequirements()
    this.getPlugins()
    return this.plugins.filter(filter)
  }
  async updatePlugin(plugin) {
    await this.getMirrors()
    plugin.isUpdating = true
    try {
      // let flow = co.wrap(function* (_this) {
      //   yield npminstall({
      //     root: _this.npmConfig.prefix,
      //     pkgs: [
      //       { name: plugin.packageName, version: plugin.lastestVersion},
      //     ],
      //     registry: _this.npmConfig.registry,
      //     debug: true
      //   })
      //   return yield Promise.resolve()
      // })
      // await flow(this)
      await promisify(npm.commands.install)([`${plugin.packageName}@${plugin.lastestVersion}`])
      return this.reloadPlugin(plugin)
    } catch (error) {
      plugin.isUpdating = false
      throw error
    }
  }
  async installPlugin(name) {
    await this.getMirrors()
    try {
      const list = this.plugins.map((plugin) => (plugin.packageName))
      // let flow = co.wrap(function* (_this) {
      //   yield npminstall({
      //     root: _this.npmConfig.prefix,
      //     pkgs: [
      //       { name: name},
      //     ],
      //     registry: _this.npmConfig.registry,
      //     debug: true
      //   })
      //   return yield Promise.resolve()
      // })
      // await flow(this)
      await promisify(npm.commands.install)([name])
      const [packName] = name.split('@')
      if (list.indexOf(packName) !== -1) {
        this.reloadPlugin(packName)
      } else {
        this.addPlugin(path.join(this.pluginPath, 'node_modules', packName))
      }
      return this.plugins = sortBy(this.plugins, 'priority')
    } catch (error) {
      console.error(error.stack)
      throw error
    }
  }
  async uninstallPlugin(plugin) {
    await this.getMirrors()
    try {
      plugin.isUninstalling = true
      this.unloadPlugin(plugin)
      this.removePlugin(plugin)
      await promisify(npm.commands.uninstall)([plugin.packageName])
    } catch (error) {
      console.error(error)
      throw error
    }
  }
  enablePlugin(plugin) {
    config.set(`plugin.${plugin.id}.enable`, true)
    plugin.enabled = true
    if (!plugin.isRead && !plugin.isBroken) {
      for (let index = 0; index < this.plugins.length; index++) {
        if (plugin.packageName === this.plugins[index].packageName) {
          let pluginMain
          try {
            pluginMain = require(plugin.pluginPath)
            pluginMain.isRead = true
            if (!plugin.packageData.poiPlugin.id && pluginMain.name) {
              plugin.id = pluginMain.name
            }
            if (pluginMain.displayName) {
              plugin.displayName = pluginMain.displayName
            }
            if (plugin.priority === 10000 && (pluginMain.priority != null)) {
              plugin.priority = pluginMain.priority
            }
          } catch (error) {
            console.error(error)
            pluginMain = {
              isBroken: true,
            }
          }
          Object.assign(pluginMain, this.plugins[index])
          if (pluginMain.isRead == null) {
            pluginMain.isRead = false
          }
          this.plugins[index] = pluginMain
          pluginMain = null
          plugin = this.plugins[index]
          break
        }
      }
    }
    return this.loadPlugin(plugin)
  }
  disablePlugin(plugin) {
    config.set(`plugin.${plugin.id}.enable`, false)
    plugin.enabled = false
    return this.unloadPlugin(plugin)
  }
  loadPlugin(plugin) {
    if (!plugin) {
      return
    }
    if (plugin.useEnv && !window._portStorageUpdated) {
      for (let i = 0; i < envKeyList.length; i++) {
        const key = envKeyList[i]
        if (window[key] != null) {
          localStorage[key] = JSON.stringify(window[key])
        }
      }
      window._portStorageUpdated = true
    }
    let windowOptions
    if (plugin.windowURL) {
      if (plugin.windowOptions) {
        windowOptions = plugin.windowOptions
        if (!get(windowOptions, 'webPreferences.preload')) {
          set(windowOptions, 'webPreferences.preload', path.join(ROOT, 'assets', 'js', 'plugin-preload.js'))
        }
      } else {
        windowOptions = {
          x: config.get('poi.window.x', 0),
          y: config.get('poi.window.y', 0),
          width: 800,
          height: 600,
          webPreferences: {
            preload: path.join(ROOT, 'assets', 'js', 'plugin-preload.js'),
          },
        }
      }
      Object.assign(windowOptions, {
        realClose: plugin.realClose,
      })
      if (plugin.multiWindow) {
        plugin.handleClick = function() {
          const pluginWindow = windowManager.createWindow(windowOptions)
          pluginWindow.loadURL(plugin.windowURL)
          pluginWindow.show()
        }
      } else if (plugin.realClose) {
        plugin.pluginWindow = null
        plugin.handleClick = function() {
          if (plugin.pluginWindow == null) {
            plugin.pluginWindow = windowManager.createWindow(windowOptions)
            plugin.pluginWindow.on('close', function() {
              plugin.pluginWindow = null
            })
            plugin.pluginWindow.loadURL(plugin.windowURL)
            plugin.pluginWindow.show()
          } else {
            plugin.pluginWindow.show()
          }
        }
      } else {
        plugin.pluginWindow = windowManager.createWindow(windowOptions)
        plugin.pluginWindow.loadURL(plugin.windowURL)
        plugin.handleClick = function() {
          return plugin.pluginWindow.show()
        }
      }
    }
    try {
      if (typeof plugin.pluginDidLoad === 'function') {
        plugin.pluginDidLoad()
      }
    } catch (error) {
      console.error(error.stack)
    }
    this.emit('plugin.loaded', plugin.packageName)
  }
  unloadPlugin(plugin) {
    if (!plugin) {
      return
    }
    try {
      if (typeof plugin.pluginWillUnload === 'function') {
        plugin.pluginWillUnload()
      }
    } catch (error) {
      console.error(error.stack)
    }
    if (plugin.pluginWindow) {
      windowManager.closeWindow(plugin.pluginWindow)
    }
    this.emit('plugin.unloaded', plugin.packageName)
  }
  removePlugin(plugin) {
    delete require.cache[require.resolve(plugin.pluginPath)]
    for (let index = 0; index < this.plugins.length; index++) {
      if (plugin.packageName === this.plugins[index].packageName) {
        this.plugins.splice(index, 1)
        break
      }
    }
    this.emit('plugin.removed', plugin.packageName)
  }
  addPlugin(pluginPath) {
    const plugin = this.readPlugin(pluginPath)
    this.plugins.push(plugin)
    this.plugins = sortBy(this.plugins, 'priority')
    if (plugin.enabled) {
      this.loadPlugin(plugin)
    }
    return this.plugins
  }
  reloadPlugin(plugin) {
    if (typeof plugin === 'string') {
      for (let index = 0; index < this.plugins.length; index++) {
        if (plugin === this.plugins[index].packageName) {
          plugin = this.plugins[index]
          break
        }
      }
    }
    if (typeof plugin === 'string') {
      console.warn('Plugin not found!')
      return
    }
    this.unloadPlugin(plugin)
    delete require.cache[require.resolve(plugin.pluginPath)]
    let newPlugin = {}
    for (let index = 0; index < this.plugins.length; index++) {
      if (plugin.packageName === this.plugins[index].packageName) {
        this.plugins[index] = null
        newPlugin = this.readPlugin(plugin.pluginPath)
        this.plugins[index] = newPlugin
        break
      }
    }
    if (plugin.enabled) {
      this.loadPlugin(newPlugin)
    }
    return this.plugins = sortBy(this.plugins, 'priority')
  }
  readPlugin(pluginPath) {
    let pluginData, packageData, plugin, pluginMain
    try {
      pluginData = fs.readJsonSync(path.join(ROOT, 'assets', 'data', 'plugin.json'))
    } catch (error) {
      pluginData = {}
      utils.error(error)
    }
    try {
      packageData = fs.readJsonSync(path.join(pluginPath, 'package.json'))
    } catch (error) {
      packageData = {}
      utils.error(error)
    }
    plugin = packageData.poiPlugin || {}
    plugin.packageData = packageData
    plugin.packageName = plugin.packageData.name || path.basename(pluginPath)
    if (plugin.name == null) {
      plugin.name = plugin.title || plugin.packageName
    }
    if (plugin.id == null) {
      plugin.id = plugin.packageName
    }
    plugin.author = get(plugin, 'packageData.author.name') || 'unknown'
    if (typeof get(plugin, 'packageData.author') === 'string') {
      plugin.author = plugin.packageData.author
    }
    plugin.link = get(plugin, 'packageData.author.links') || get(plugin, 'packageData.author.url') || (pluginData[plugin.packageName] || {}).link || "https://github.com/poooi"
    if (plugin.description == null) {
      plugin.description = (plugin.packageData || {}).description || (pluginData[plugin.packageName] || {})[`des${language}`] || "unknown"
    }
    plugin.pluginPath = pluginPath
    if (plugin.icon == null) {
      plugin.icon = 'fa/th-large'
    }
    plugin.version = (plugin.packageData || {}).version || '0.0.0'
    plugin.lastestVersion = plugin.version
    if (!plugin.earliestCompatibleMain) {
      plugin.earliestCompatibleMain = '0.0.0'
    }
    if (!plugin.lastApiVer) {
      plugin.lastApiVer = plugin.version
    }
    if (!plugin.priority) {
      plugin.priority = 10000
    }
    plugin.enabled = config.get(`plugin.${plugin.id}.enable`, true)
    plugin.isInstalled = true
    plugin.needRollback = false
    if (plugin.apiVer) {
      let nearestCompVer = 'v214.748.3647'
      for (const mainVersion in plugin.apiVer) {
        if (semver.lte(window.POI_VERSION, mainVersion) && semver.lt(mainVersion, nearestCompVer) && semver.gt(plugin.version, plugin.apiVer[mainVersion])) {
          plugin.needRollback = true
          nearestCompVer = mainVersion
          plugin.lastestVersion = plugin.apiVer[mainVersion]
        }
      }
    }
    plugin.isOutdated = plugin.needRollback
    let i18nFile = null
    if (plugin.i18nDir != null) {
      i18nFile = path.join(pluginPath, plugin.i18nDir)
    } else {
      try {
        fs.accessSync(path.join(pluginPath, 'i18n'))
        i18nFile = path.join(pluginPath, 'i18n')
      } catch (error) {
        try {
          fs.accessSync(path.join(pluginPath, 'assets', 'i18n'))
          i18nFile = path.join(pluginPath, 'assets', 'i18n')
        } catch (error) {
          //console.warn('No translate file found.')
        }
      }
    }
    if (i18nFile != null) {
      const namespace = plugin.id
      window.i18n[namespace] = new (require('i18n-2'))({
        locales: ['ko-KR', 'en-US', 'ja-JP', 'zh-CN', 'zh-TW'],
        defaultLocale: 'zh-CN',
        directory: i18nFile,
        updateFiles: false,
        indent: "\t",
        extension: '.json',
        devMode: false,
      })
      window.i18n[namespace].setLocale(window.language)
      plugin.name = window.i18n[namespace].__(plugin.name)
      plugin.description = window.i18n[namespace].__(plugin.description)
    }
    let icon = plugin.icon.split('/')[1] || plugin.icon || 'th-large'
    plugin.displayName = (
      <span>
        <FontAwesome key={0} name={icon} />
        {' ' + plugin.name}
      </span>
    )
    if (plugin.enabled && !plugin.needRollback) {
      try {
        pluginMain = require(pluginPath)
        pluginMain.isRead = true
        if (!get(plugin, 'packageData.poiPlugin.id') && pluginMain.name) {
          plugin.id = pluginMain.name
        }
        if (pluginMain.displayName) {
          plugin.displayName = pluginMain.displayName
        }
        if (plugin.priority === 10000 && (pluginMain.priority != null)) {
          plugin.priority = pluginMain.priority
        }
      } catch (error) {
        console.error(`[Plugin ${plugin.name}] `, error.stack)
        pluginMain = {
          isBroken: true,
        }
      }
      Object.assign(pluginMain, plugin)
      plugin = pluginMain
      pluginMain = null
      if (plugin.isRead == null) {
        plugin.isRead = false
      }
    }
    return plugin
  }
  async notifyFailed() {
    const plugins = await this.getBrokenPlugins()
    const unreadList = []
    for (let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i]
      unreadList.push(plugin.name)
    }
    if (unreadList.length > 0) {
      const content = `${unreadList.join(' ')} ${__('failed to load. Maybe there are some compatibility problems.')}`
      notify(content, {
        type: 'plugin error',
        title: __('Plugin error'),
        icon: path.join(ROOT, 'assets', 'img', 'material', '7_big.png'),
        audio: `file://${ROOT}/assets/audio/fail.mp3`,
      })
    }
  }
}

const pluginManager = new PluginManager(
  path.join(ROOT, 'assets', 'data', 'plugin.json'),
  PLUGIN_PATH,
  path.join(ROOT, 'assets', 'data', 'mirror.json')
)

export default pluginManager
