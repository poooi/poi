import * as remote from '@electron/remote'
import EventEmitter from 'events'
import { access } from 'fs'
import { readJsonSync, accessSync, ensureDir, writeJSON } from 'fs-extra'
import glob from 'glob'
import { fromPairs, map } from 'lodash'
import fetch from 'node-fetch'
/* global PLUGIN_PATH, PLUGIN_EXTRA_PATH, dispatch, config, getStore, toast, ROOT */
import { join } from 'path-extra'
import semver from 'semver'
import i18next from 'views/env-parts/i18next'
import { sortPlugins } from 'views/redux/plugins'

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
  getNpmConfig,
} from './utils'

const fetchHeader = new Headers()
fetchHeader.set('Cache-Control', 'max-age=0')
const defaultFetchOption = {
  method: 'GET',
  cache: 'default',
  headers: fetchHeader,
}

const PLUGIN_NAME_WILDCARD = 'poi-plugin-*'

const PACKAGE_JSON_PATH = join(PLUGIN_PATH, 'package.json')

const getPluginPath = (packageName) => join(PLUGIN_PATH, 'node_modules', packageName)

const getPluginExtraPath = (packageName) => join(PLUGIN_EXTRA_PATH, 'node_modules', packageName)

const PLUGIN_DATA_PATH = join(ROOT, 'assets', 'data', 'plugin.json')

const BUNDLED_PLUGINS = readJsonSync(PLUGIN_DATA_PATH)

class PluginManager extends EventEmitter {
  VALID = 0
  DISABLED = 1
  NEEDUPDATE = 2
  BROKEN = 3

  async initialize() {
    await this.getPlugins()
    this.emit('initialized')
  }

  async readFromWildcardPath(wildcardPath, isExtra = false) {
    const pluginPaths = await new Promise((res) => glob(wildcardPath, (err, files) => res(files)))
    return sortPlugins(
      await Promise.all(
        pluginPaths.map(async (pluginPath) => {
          return await readPlugin(pluginPath, isExtra)
        }),
      ),
    )
  }

  async mergePlugins(plugins, extraPlugins) {
    const extraPluginIdSet = new Set(extraPlugins.map((plugin) => plugin.id))
    return sortPlugins([
      ...plugins.filter((plugin) => !extraPluginIdSet.has(plugin.id)),
      ...extraPlugins,
    ])
  }

  async enablePlugins(plugins) {
    return Promise.all(
      plugins.map(async (plugin) => {
        if (plugin.enabled && !window.isSafeMode) {
          return await enablePlugin(plugin)
        }
        return plugin
      }),
    )
  }

  // workaround to generates package.json if not existed
  async ensurePackageJson(plugins) {
    try {
      await access(PACKAGE_JSON_PATH)
    } catch (e) {
      const packageJsonContent = {
        dependencies: fromPairs(
          plugins
            .slice()
            .sort((a, b) => (a.packageName < b.packageName ? -1 : 1))
            .map((plugin) => [plugin.packageName, '^' + plugin.version]),
        ),
      }
      await writeJSON(PACKAGE_JSON_PATH, packageJsonContent, { spaces: 2 })
    }
  }

  async readPlugins() {
    const plugins = await this.readFromWildcardPath(getPluginPath(PLUGIN_NAME_WILDCARD))
    await this.ensurePackageJson(plugins)
    const extraPlugins = await this.readFromWildcardPath(
      getPluginExtraPath(PLUGIN_NAME_WILDCARD),
      true,
    )
    const mergedPlugins = await this.enablePlugins(await this.mergePlugins(plugins, extraPlugins))
    const npmConfig = getNpmConfig(PLUGIN_PATH)
    notifyFailed(plugins, npmConfig)
    dispatch({
      type: '@@Plugin/initialize',
      value: mergedPlugins,
    })
    return mergedPlugins
  }

  isMetRequirement(plugin) {
    let lowest
    if (!plugin.isRead) {
      return false
    }
    if ((BUNDLED_PLUGINS[plugin.packageName] || {}).version) {
      lowest = BUNDLED_PLUGINS[plugin.packageName].version
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
    } else {
      return await this.readPlugins()
    }
  }

  getInstalledPlugins() {
    return this.getFilteredPlugins((plugin) => plugin.isInstalled)
  }

  getUninstalledPluginSettings() {
    const installedPlugins = this.getInstalledPlugins()
    const installedPluginNames = installedPlugins.map((plugin) => plugin.packageName)
    const uninstalled = {}
    for (const name in BUNDLED_PLUGINS) {
      const value = BUNDLED_PLUGINS[name]
      if (!installedPluginNames.includes(name)) {
        uninstalled[name] = value
      }
    }
    return uninstalled
  }

  getReadPlugins() {
    return this.getFilteredPlugins((plugin) => plugin.isRead)
  }

  getUnreadPlugins() {
    return this.getFilteredPlugins((plugin) => !plugin.isRead)
  }

  getBrokenPlugins() {
    return this.getFilteredPlugins((plugin) => plugin.isBroken)
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

  getUpdateStatus() {
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
    const npmConfig = getNpmConfig(PLUGIN_PATH)
    const data = await fetch(
      `${npmConfig.registry}${plugin.packageName}/latest`,
      defaultFetchOption,
    )
      .then((res) => (res.ok ? res.json() : undefined))
      .catch((e) => undefined)
    if (!data || !data.version) {
      console.warn(`Can't find update info of plugin ${plugin.packageName}`)
      return
    }

    const distTag = {
      latest: data.version,
    }
    if (npmConfig.enableBetaPluginCheck) {
      const npmConfig = getNpmConfig(PLUGIN_PATH)
      const betaData = await fetch(
        `${npmConfig.registry}${plugin.packageName}/beta`,
        defaultFetchOption,
      )
        .then((res) => (res.ok ? res.json() : undefined))
        .catch((e) => undefined)
      if (betaData && betaData.version) {
        Object.assign(distTag, {
          beta: betaData.version,
        })
      }
    }
    let latest = `${plugin.version}`
    let notCompatible = false
    const apiVer = (data.poiPlugin || {}).apiVer || plugin.apiVer || {}
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
    if (!notCompatible && npmConfig.enableBetaPluginCheck && distTag.beta) {
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
    const plugins = this.getInstalledPlugins()
    const outdatedList = (
      await Promise.all(
        plugins.map((plugin) =>
          this.getPluginOutdateInfo(plugin).catch((err) => console.error(err.stack)),
        ),
      )
    ).filter(Boolean)
    if (isNotif && outdatedList.length > 0) {
      const content = `${map(outdatedList, 'name').join(' / ')} ${i18next.t(
        'setting:PluginUpdateMsg',
      )}`
      toast(content, {
        type: 'info',
        title: i18next.t('setting:Plugin update'),
      })
    }
  }

  async installPlugin(packageSource, version) {
    if (packageSource.includes('@')) [packageSource, version] = packageSource.split('@')

    // 1) See if it is installed by plugin name
    const installingByPluginName = do {
      try {
        accessSync(packageSource)
        false
      } catch (e) {
        true
      }
    }
    if (installingByPluginName)
      dispatch({
        type: '@@Plugin/changeStatus',
        value: { packageName: packageSource },
        option: [{ path: 'isUpdating', status: true }],
      })

    // 2) Install plugin
    try {
      const npmConfig = getNpmConfig(PLUGIN_PATH)
      await installPackage(packageSource, version, npmConfig)
    } catch (e) {
      this.emit('installfailed', packageSource)
      console.error(e.stack)
      throw e
    }

    // 3) Get plugin name
    const packageName = installingByPluginName
      ? packageSource
      : await findInstalledTarball(join(PLUGIN_PATH, 'node_modules'), packageSource)

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
      let plugin = await readPlugin(getPluginPath(packageName))
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
          option: [{ path: 'isUpdating', status: false }],
        })
      console.error(error.stack)
      throw error
    }
  }

  async uninstallPlugin(plugin) {
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
      if (!plugin.isExtra) {
        const npmConfig = getNpmConfig(PLUGIN_PATH)
        await removePackage(plugin.packageName, npmConfig)
        // Make sure the plugin no longer exists in PLUGIN_PATH
        // (unless it's a git repo)
        await safePhysicallyRemove(getPluginPath(plugin.packageName))
      } else {
        await safePhysicallyRemove(getPluginExtraPath(plugin.packageName))
      }
    } catch (error) {
      console.error(error.stack)
    }
  }

  async gracefulRepair(repair = true) {
    const plugins = this.getInstalledPlugins()
    const modulePath = join(PLUGIN_PATH, 'node_modules')
    await safePhysicallyRemove(modulePath)
    await ensureDir(modulePath)
    await Promise.all(plugins.map((plugin) => this.uninstallPlugin(plugin)))

    if (!repair) {
      return
    }

    await Promise.all(plugins.map((plugin) => this.installPlugin(plugin.packageName)))
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

  async reloadPlugin(plugin) {
    try {
      await this.disablePlugin(plugin)
      // eslint-disable-next-line require-atomic-updates
      plugin.isBroken = false
      await this.enablePlugin(plugin)
    } catch (error) {
      console.error(error.stack)
    }
  }
}

const pluginManager = new PluginManager()

window.reloadPlugin = async (pkgName, verbose = false) => {
  const { plugins } = getStore()
  const plugin = plugins.find((pkg) => [pkgName, `poi-plugin-${pkgName}`].includes(pkg.packageName))
  if (!plugin) {
    console.error(`plugin "${pkgName}" not found`)
    return
  }
  await pluginManager.reloadPlugin(plugin)
}

window.gracefulResetPlugin = () => pluginManager.gracefulRepair(false)

remote.getCurrentWebContents().once('dom-ready', () => pluginManager.initialize())

export default pluginManager
