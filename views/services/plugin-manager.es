import path from 'path-extra'
import semver from 'semver'
import EventEmitter from 'events'
import fs from 'fs-extra'
import request from 'request'
import npm from 'npm'
import glob from 'glob'
import { promisify, promisifyAll } from 'bluebird'
import { sortBy, map } from 'lodash'

const __ = window.i18n.setting.__.bind(window.i18n.setting)
const {config, toast, proxy, ROOT, PLUGIN_PATH, dispatch, getStore} = window
const requestAsync = promisify(promisifyAll(request), {multiArgs: true})

import { installPackage, readPlugin, enablePlugin, disablePlugin, unloadPlugin, notifyFailed } from './plugin-manager-utils'

class PluginManager extends EventEmitter {
  constructor(packagePath, pluginRoot, mirrorPath) {
    super(packagePath, pluginRoot, mirrorPath)
    this.packagePath = packagePath
    this.pluginRoot = pluginRoot
    this.mirrorPath = mirrorPath
    this.requirements = null
    this.mirrors = null
    this.config = {
      production: true,
      mirror: null,
      proxy: null,
      betaCheck: null,
    }
    this.npmConfig = {
      prefix: this.pluginRoot,
      registry: "https://registry.npmjs.org",
      progress: false,
    }
    this.VALID = 0
    this.DISABLED = 1
    this.NEEDUPDATE = 2
    this.BROKEN = 3
  }
  getPluginPath(packageName) {
    return path.join(this.pluginRoot, 'node_modules', packageName)
  }
  initialize() {
    this.getConf()
    this.getPlugins()
  }
  readPlugins() {
    const pluginPaths = glob.sync(this.getPluginPath('poi-plugin-*'))
    let plugins = pluginPaths.map((pluginPath) => {
      let plugin = readPlugin(pluginPath)
      if (plugin.enabled) {
        plugin = enablePlugin(plugin)
      }
      return plugin
    })
    plugins = sortBy(plugins, 'priority')
    notifyFailed(plugins)
    dispatch({
      type: '@@Plugin/initialize',
      value: plugins,
    })
  }
  getRequirements() {
    if (this.requirements == null)
      this.requirements = fs.readJsonSync(this.packagePath)
    return this.requirements
  }
  getMirrors() {
    if (this.mirrors == null) {
      this.mirrors = fs.readJsonSync(this.mirrorPath)
      const mirrorConf = config.get('packageManager.mirrorName', (navigator.language === 'zh-CN') ?  "taobao" : "npm")
      const proxyConf = config.get("packageManager.proxy", false)
      const betaCheck = config.get("packageManager.enableBetaPluginCheck", false)
      this.selectConfig(mirrorConf, proxyConf, betaCheck)
    }
    return this.mirrors
  }
  selectConfig(name, enable, check) {
    this.getMirrors()
    if (name) {
      this.config.mirror = this.mirrors[name]
      config.set("packageManager.mirrorName", name)
    }
    if (enable != null) {
      this.config.proxy = enable
      config.set("packageManager.proxy", enable)
    }
    if (check != null) {
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
    npm.load(this.npmConfig)
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
    if (getStore('plugins').length > 0) {
      return getStore('plugins')
    }
    else {
      return this.readPlugins()
    }
  }
  getConf() {
    this.getMirrors()
    return this.config
  }
  getInstalledPlugins() {
    return this.getFilteredPlugins((plugin) => (plugin.isInstalled))
  }
  getUninstalledPluginSettings() {
    this.getRequirements()
    const installedPlugins = this.getInstalledPlugins()
    const installedPluginNames = installedPlugins.map((plugin) => (plugin.packageName))
    const uninstalled = {}
    for (const name in this.requirements) {
      const value = this.requirements[name]
      if (!installedPluginNames.includes(name)) {
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
  getFilteredPlugins(filter) {
    return getStore('plugins').filter(filter)
  }
  getUpdateStatus () {
    for (const i in getStore('plugins')) {
      if (getStore('plugins')[i].isOutdated) {
        return true
      }
    }
    return false
  }

  // Resolves the latest plugin if need update
  // Resolves undefined if not
  getPluginOutdateInfo = async (plugin) => {
    // If needRollback, then we don't need the latest version; we instead
    // display the version it should be rolled back to
    if (plugin.needRollback) {
      return
    }
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
    const apiVer = ((data.poiPlugin || {}).apiVer || plugin.apiVer) || {}
    let nearestCompVer = 'v214.748.3647'
    for (const mainVersion of Object.keys(apiVer)) {
      if (!apiVer[mainVersion]) {
        continue
      }
      if (semver.lte(window.POI_VERSION, mainVersion) && semver.lt(mainVersion, nearestCompVer)) {
        notCompatible = true
        nearestCompVer = mainVersion
        latest = apiVer[mainVersion]
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
      dispatch({
        type: '@@Plugin/changeStatus',
        value: plugin,
        option: [
          {
            path: 'isOutdated',
            status: true,
          },
          {
            path: 'latestVersion',
            status: latest,
          },
        ],
      })
      return plugin
    }
  }

  async getOutdatedPlugins(isNotif) {
    this.getMirrors()
    const plugins = this.getInstalledPlugins()
    const outdatedList = (await Promise.all(plugins.map((plugin) =>
      this.getPluginOutdateInfo(plugin).catch((err) => console.error(err.stack))
    ))).filter(Boolean)
    if (isNotif && outdatedList.length > 0) {
      const content = `${map(outdatedList, 'name').join(' / ')} ${__("have newer version. Please update your plugins.")}`
      toast(content, {
        type: 'info',
        title: __('Plugin update'),
      })
    }
  }

  async installPlugin(packageName, version) {
    if (packageName.includes('@'))
      [packageName, version] = packageName.split('@')
    this.getMirrors()
    const nowPlugin = getStore('plugins').find((plugin) => plugin.packageName === packageName)
    if (nowPlugin) {
      dispatch({
        type: '@@Plugin/changeStatus',
        value: nowPlugin,
        option: [{path: 'isUpdating', status: true}],
      })
      try {
        unloadPlugin(nowPlugin)
      } catch (error) {
        console.error(error.stack)
      }
    }
    try {
      await installPackage(packageName, version)
      let plugin = readPlugin(this.getPluginPath(packageName))
      if (plugin.enabled) {
        plugin = enablePlugin(plugin)
      }
      dispatch({
        type: '@@Plugin/add',
        value: plugin,
      })
    } catch (error) {
      if (nowPlugin)
        dispatch({
          type: '@@Plugin/changeStatus',
          value: nowPlugin,
          option: [{path: 'isUpdating', status: false}],
        })
      console.error(error.stack)
      throw error
    }
  }

  async uninstallPlugin(plugin) {
    this.getMirrors()
    try {
      dispatch({
        type: '@@Plugin/changeStatus',
        value: plugin,
        option: [
          {
            path: 'isUninstalling',
            status: true,
          },
        ],
      })
      this.removePlugin(plugin)
    } catch (error) {
      console.error(error.stack)
    }
    try {
      await promisify(npm.commands.uninstall)([plugin.packageName])
      if (plugin.pluginPath.includes(PLUGIN_PATH)) {
        fs.removeSync(plugin.pluginPath)
      }
    } catch (error) {
      console.error(error.stack)
    }
  }

  enablePlugin(plugin) {
    plugin.enabled = true
    if (!plugin.isBroken) {
      plugin = enablePlugin(plugin)
    }
    config.set(`plugin.${plugin.id}.enable`, true)
    dispatch({
      type: '@@Plugin/add',
      value: plugin,
    })
  }

  disablePlugin(plugin) {
    config.set(`plugin.${plugin.id}.enable`, false)
    plugin = disablePlugin(plugin)
    dispatch({
      type: '@@Plugin/add',
      value: plugin,
    })
  }

  removePlugin(plugin) {
    try {
      plugin = unloadPlugin(plugin)
    } catch (error) {
      console.error(error.stack)
    }
    dispatch({
      type: '@@Plugin/remove',
      value: plugin,
    })
  }
}

const pluginManager = new PluginManager(
  path.join(ROOT, 'assets', 'data', 'plugin.json'),
  PLUGIN_PATH,
  path.join(ROOT, 'assets', 'data', 'mirror.json')
)

pluginManager.initialize()

export default pluginManager
