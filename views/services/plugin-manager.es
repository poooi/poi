import { join } from 'path-extra'
import semver from 'semver'
import EventEmitter from 'events'
import { readJsonSync, accessSync } from 'fs-extra'
import glob from 'glob'
import { delay } from 'bluebird'
import { sortBy, map } from 'lodash'

const __ = window.i18n.setting.__.bind(window.i18n.setting)
const {config, toast, proxy, ROOT, PLUGIN_PATH, dispatch, getStore} = window

const fetchHeader = new Headers()
fetchHeader.set("Cache-Control", "max-age=0")
const fetchFromRemote = async (url, cacheMode = "default") => {
  try {
    return (await fetch(url, {method: "GET", cache: cacheMode, headers: fetchHeader}).catch(e => null)).json()
  } catch (e) {
    return {}
  }
}

import {
  installPackage,
  removePackage,
  readPlugin,
  enablePlugin,
  disablePlugin,
  unloadPlugin,
  notifyFailed,
  safePhysicallyRemove,
  findInstalledTarball,
} from './plugin-manager-utils'

function defaultPluginPath(packageName) {
  return join(PLUGIN_PATH, 'node_modules', packageName)
}

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
    return join(this.pluginRoot, 'node_modules', packageName)
  }
  async initialize() {
    this.getConf()
    this.getPlugins()
  }
  async readPlugins() {
    const pluginPaths = await new Promise(res => glob(this.getPluginPath('poi-plugin-*'), (err, files) => res(files)))
    let plugins = await Promise.all(pluginPaths.map(async(pluginPath) => {
      let plugin = await readPlugin(pluginPath)
      if (plugin.enabled && !window.isSafeMode) {
        plugin = await enablePlugin(plugin)
      }
      return plugin
    }))
    plugins = sortBy(plugins, 'priority')
    notifyFailed(plugins)
    dispatch({
      type: '@@Plugin/initialize',
      value: plugins,
    })
  }
  getRequirements() {
    if (this.requirements == null)
      this.requirements = readJsonSync(this.packagePath)
    return this.requirements
  }
  getMirrors() {
    return readJsonSync(this.mirrorPath)
  }
  async loadConfig() {
    if (this.mirrors == null) {
      this.mirrors = readJsonSync(this.mirrorPath)
      const mirrorConf = config.get('packageManager.mirrorName')
      const mirrorName = Object.keys(this.mirrors).includes(mirrorConf) ?
        mirrorConf : ((navigator.language === 'zh-CN') ?  "taobao" : "npm")
      const proxyConf = config.get("packageManager.proxy", false)
      const betaCheck = config.get("packageManager.enableBetaPluginCheck", false)
      await this.selectConfig(mirrorName, proxyConf, betaCheck, false)
      this.npmLoaded = true
    }
    while (!this.npmLoaded) {
      await delay(1000)
    }
    return this.mirrors
  }
  async selectConfig(name, enable, check) {
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
  async getPlugins() {
    if (getStore('plugins').length > 0) {
      return getStore('plugins')
    }
    else {
      return await this.readPlugins()
    }
  }
  async getConf() {
    await this.loadConfig()
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
    const data = await fetchFromRemote(`${this.config.mirror.server}${plugin.packageName}/latest`)
    if (data.error) {
      console.warn(`Can't find update info of plugin ${plugin.packageName}`, data)
      return
    }
    const distTag = {
      latest: data.version,
    }
    if (this.config.betaCheck) {
      const betaData = await fetchFromRemote(`${this.config.mirror.server}${plugin.packageName}/beta`)
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
    await this.loadConfig()
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

  async installPlugin(packageSource, version) {
    if (packageSource.includes('@'))
      [packageSource, version] = packageSource.split('@')
    await this.loadConfig()

    // 1) See if it is installed by plugin name
    const installingByPluginName = (function () {
      try {
        accessSync(packageSource)
        return false
      } catch (e) {
        return true
      }
    })()
    if (installingByPluginName)
      dispatch({
        type: '@@Plugin/changeStatus',
        value: {packageName: packageSource},
        option: [{path: 'isUpdating', status: true}],
      })
    // 2) Install plugin
    try {
      await installPackage(packageSource, version, this.npmConfig)
    } catch (e) {
      console.error(e.stack)
      throw e
    }
    // 3) Get plugin name
    const packageName = installingByPluginName ? packageSource :
      await findInstalledTarball(join(this.pluginRoot, 'node_modules'), packageSource)
    // 4) Unload plugin if it's running
    const nowPlugin = getStore('plugins').find((plugin) => plugin.packageName === packageName)
    if (nowPlugin) {
      try {
        unloadPlugin(nowPlugin)
      } catch (error) {
        console.error(error.stack)
      }
    }
    // 5) Read plugin and load it
    try {
      let plugin = readPlugin(this.getPluginPath(packageName))
      if (plugin.enabled) {
        plugin = await enablePlugin(plugin, false)
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
    await this.loadConfig()
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
      await removePackage(plugin.packageName, this.npmConfig)
      // Make sure the plugin no longer exists in PLUGIN_PATH
      // (unless it's a git repo)
      await safePhysicallyRemove(defaultPluginPath(plugin.packageName))
    } catch (error) {
      console.error(error.stack)
    }
  }

  async enablePlugin(plugin) {
    plugin.enabled = true
    if (!plugin.isBroken) {
      plugin = await enablePlugin(plugin)
    }
    config.set(`plugin.${plugin.id}.enable`, true)
    dispatch({
      type: '@@Plugin/add',
      value: plugin,
    })
  }

  async disablePlugin(plugin) {
    config.set(`plugin.${plugin.id}.enable`, false)
    plugin = await disablePlugin(plugin)
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
  join(ROOT, 'assets', 'data', 'plugin.json'),
  PLUGIN_PATH,
  join(ROOT, 'assets', 'data', 'mirror.json')
)

window.reloadPlugin = (pkgName, verbose=false) => {
  const { plugins } = getStore()
  const plugin =
    plugins.find(pkg => pkg.packageName === pkgName) ||
    plugins.find(pkg => pkg.packageName === `poi-plugin-${pkgName}`)
  if (!plugin) {
    console.error(`plugin "${pkgName}" not found`)
    return
  }
  pluginManager.disablePlugin(plugin)
  if (verbose)
    // eslint-disable-next-line no-console
    console.log(`plugin "${plugin.id}" disabled, re-enabling...`)
  pluginManager.enablePlugin(plugin)
  if (verbose)
    // eslint-disable-next-line no-console
    console.log(`plugin "${plugin.id}" enabled.`)
}

function initPlugin() {
  window.removeEventListener('webview-loaded', initPlugin)
  pluginManager.initialize()
}
window.addEventListener('webview-loaded', initPlugin)

export default pluginManager
