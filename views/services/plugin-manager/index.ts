import * as remote from '@electron/remote'
import EventEmitter from 'events'
import { access } from 'fs'
import { readJsonSync, accessSync, ensureDir, writeJSON } from 'fs-extra'
import glob from 'glob'
import { fromPairs, map } from 'lodash'
import fetch from 'node-fetch'
import { join } from 'path'
import semver from 'semver'
import { dispatch, getStore } from 'views/create-store'
import { config, PLUGIN_EXTRA_PATH, PLUGIN_PATH, ROOT } from 'views/env'
import i18next from 'views/env-parts/i18next'
import {
  createPluginAddAction,
  createPluginChangeStatusAction,
  createPluginInitializeAction,
  createPluginRemoveAction,
} from 'views/redux/actions/plugins'
import { sortPlugins } from 'views/redux/plugins'

import type { BundlePluginMeta, Plugin, NpmConfig } from './utils'

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
  isRecord,
} from './utils'

const defaultFetchOption = {
  method: 'GET',
  cache: 'default' as RequestCache,
  headers: {
    'Cache-Control': 'max-age=0',
  },
}

const PLUGIN_NAME_WILDCARD = 'poi-plugin-*'
const PACKAGE_JSON_PATH = join(PLUGIN_PATH, 'package.json')
const getPluginPath = (packageName: string) => join(PLUGIN_PATH, 'node_modules', packageName)
const getPluginExtraPath = (packageName: string) =>
  join(PLUGIN_EXTRA_PATH, 'node_modules', packageName)
const PLUGIN_DATA_PATH = join(ROOT, 'assets', 'data', 'plugin.json')
const BUNDLED_PLUGINS: Record<string, BundlePluginMeta> = readJsonSync(PLUGIN_DATA_PATH)

const getPlugins = () => getStore('plugins')

class PluginManager extends EventEmitter {
  readonly VALID = 0
  readonly DISABLED = 1
  readonly NEEDUPDATE = 2
  readonly BROKEN = 3

  async initialize(): Promise<void> {
    await this.getPlugins()
    this.emit('initialized')
  }

  private async readFromWildcardPath(wildcardPath: string, isExtra = false): Promise<Plugin[]> {
    const pluginPaths = await new Promise<string[]>((res) =>
      glob(wildcardPath, (err, files) => res(files ?? [])),
    )
    return sortPlugins(await Promise.all(pluginPaths.map((p) => readPlugin(p, isExtra))))
  }

  private mergePlugins(plugins: Plugin[], extraPlugins: Plugin[]): Plugin[] {
    const extraPluginIdSet = new Set(extraPlugins.map((plugin) => plugin.id))
    return sortPlugins([
      ...plugins.filter((plugin) => !extraPluginIdSet.has(plugin.id)),
      ...extraPlugins,
    ])
  }

  private async enablePlugins(plugins: Plugin[]): Promise<Plugin[]> {
    return Promise.all(
      plugins.map((plugin) =>
        plugin.enabled && !window.isSafeMode ? enablePlugin(plugin) : plugin,
      ),
    )
  }

  private async ensurePackageJson(plugins: Plugin[]): Promise<void> {
    try {
      await new Promise<void>((res, rej) => access(PACKAGE_JSON_PATH, (e) => (e ? rej(e) : res())))
    } catch (_) {
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

  async readPlugins(): Promise<Plugin[]> {
    const plugins = await this.readFromWildcardPath(getPluginPath(PLUGIN_NAME_WILDCARD))
    await this.ensurePackageJson(plugins)
    const extraPlugins = await this.readFromWildcardPath(
      getPluginExtraPath(PLUGIN_NAME_WILDCARD),
      true,
    )
    const mergedPlugins = await this.enablePlugins(this.mergePlugins(plugins, extraPlugins))
    const npmConfig = getNpmConfig(PLUGIN_PATH)
    notifyFailed(plugins, npmConfig)
    dispatch(createPluginInitializeAction(mergedPlugins))
    return mergedPlugins
  }

  isMetRequirement(plugin: Plugin): boolean {
    if (!plugin.isRead) return false
    const lowest = BUNDLED_PLUGINS[plugin.packageName]?.version ?? 'v0.0.0'
    return semver.gte(plugin.version, lowest)
  }

  isEnabled(plugin: Plugin): boolean {
    if (!plugin.isRead) return false
    return plugin.enabled
  }

  isValid(plugin: Plugin): boolean {
    if (!plugin.isRead) return false
    if (!plugin.isInstalled) return false
    if (!this.isEnabled(plugin)) return false
    return this.isMetRequirement(plugin)
  }

  getStatusOfPlugin(plugin: Plugin): number {
    if (plugin.isBroken || plugin.needRollback) return this.BROKEN
    if (!plugin.isRead) return this.DISABLED
    if (!this.isMetRequirement(plugin)) return this.NEEDUPDATE
    if (!this.isEnabled(plugin)) return this.DISABLED
    return this.VALID
  }

  async getPlugins(): Promise<Plugin[]> {
    const stored = getPlugins()
    return stored.length > 0 ? stored : this.readPlugins()
  }

  getInstalledPlugins(): Plugin[] {
    return this.getFilteredPlugins((plugin) => plugin.isInstalled)
  }

  getUninstalledPluginSettings(): Record<string, BundlePluginMeta> {
    const installedNames = this.getInstalledPlugins().map((p) => p.packageName)
    const uninstalled: Record<string, BundlePluginMeta> = {}
    for (const name in BUNDLED_PLUGINS) {
      if (!installedNames.includes(name)) {
        uninstalled[name] = BUNDLED_PLUGINS[name]
      }
    }
    return uninstalled
  }

  getReadPlugins(): Plugin[] {
    return this.getFilteredPlugins((plugin) => plugin.isRead === true)
  }

  getUnreadPlugins(): Plugin[] {
    return this.getFilteredPlugins((plugin) => !plugin.isRead)
  }

  getBrokenPlugins(): Plugin[] {
    return this.getFilteredPlugins((plugin) => plugin.isBroken === true)
  }

  getValidPlugins(): Plugin[] {
    return this.getFilteredPlugins(this.isValid.bind(this))
  }

  getMetRequirementPlugins(): Plugin[] {
    return this.getFilteredPlugins(this.isMetRequirement.bind(this))
  }

  getFilteredPlugins(filter: (plugin: Plugin) => boolean): Plugin[] {
    return getPlugins().filter(filter)
  }

  getUpdateStatus(): boolean {
    return getPlugins().some((plugin) => plugin.isOutdated)
  }

  getPluginOutdateInfo = async (plugin: Plugin): Promise<Plugin | undefined> => {
    if (plugin.needRollback) return undefined
    const npmConfig = getNpmConfig(PLUGIN_PATH)
    const data: Record<string, unknown> | undefined = await fetch(
      `${npmConfig.registry}${plugin.packageName}/latest`,
      defaultFetchOption,
    )
      .then((res) => (res.ok ? res.json() : undefined))
      .catch(() => undefined)
    if (!data?.['version']) {
      console.warn(`Can't find update info of plugin ${plugin.packageName}`)
      return undefined
    }

    const distTag: Record<string, string> = {
      latest: typeof data['version'] === 'string' ? data['version'] : plugin.version,
    }
    if (npmConfig.enableBetaPluginCheck) {
      const innerNpmConfig = getNpmConfig(PLUGIN_PATH)
      const betaData: Record<string, unknown> | undefined = await fetch(
        `${innerNpmConfig.registry}${plugin.packageName}/beta`,
        defaultFetchOption,
      )
        .then((res) => (res.ok ? res.json() : undefined))
        .catch(() => undefined)
      if (betaData && typeof betaData['version'] === 'string') {
        distTag['beta'] = betaData['version']
      }
    }

    let latest = plugin.version
    let notCompatible = false
    const remotePoiPlugin = isRecord(data['poiPlugin']) ? data['poiPlugin'] : {}
    const remoteApiVer = isRecord(remotePoiPlugin['apiVer']) ? remotePoiPlugin['apiVer'] : {}
    const apiVer: Record<string, unknown> = Object.keys(remoteApiVer).length
      ? remoteApiVer
      : (plugin.apiVer ?? {})
    let nearestCompVer = 'v214.748.3647'
    for (const mainVersion of Object.keys(apiVer)) {
      const apiVerValue = apiVer[mainVersion]
      if (!apiVerValue) continue
      if (semver.lte(window.POI_VERSION, mainVersion) && semver.lt(mainVersion, nearestCompVer)) {
        notCompatible = true
        nearestCompVer = mainVersion
        latest = typeof apiVerValue === 'string' ? apiVerValue : latest
      }
    }
    if (!notCompatible && npmConfig.enableBetaPluginCheck && distTag['beta']) {
      if (semver.gt(distTag['beta'], latest)) latest = distTag['beta']
    }
    if (!notCompatible && semver.gt(distTag['latest'], latest)) {
      latest = distTag['latest']
    }
    if (semver.gt(latest, plugin.version)) {
      dispatch(
        createPluginChangeStatusAction({
          packageName: plugin.packageName,
          option: [
            { path: 'isOutdated', status: true },
            { path: 'latestVersion', status: latest },
          ],
        }),
      )
      return plugin
    }
    return undefined
  }

  async getOutdatedPlugins(isNotif = false): Promise<void> {
    const plugins = this.getInstalledPlugins()
    const outdatedList = (
      await Promise.all(
        plugins.map((plugin) =>
          this.getPluginOutdateInfo(plugin).catch((err: unknown) => {
            console.error(err instanceof Error ? err.stack : err)
            return undefined
          }),
        ),
      )
    ).filter((p): p is Plugin => p != null)
    if (isNotif && outdatedList.length > 0) {
      const content = `${map(outdatedList, 'name').join(' / ')} ${i18next.t('setting:PluginUpdateMsg')}`
      window.toast(content, { type: 'info', title: i18next.t('setting:Plugin update') })
    }
  }

  async installPlugin(packageSource: string, version?: string): Promise<void> {
    if (packageSource.includes('@')) {
      const parts = packageSource.split('@')
      packageSource = parts[0]
      version = parts[1]
    }

    let installingByPluginName: boolean
    try {
      accessSync(packageSource)
      installingByPluginName = false
    } catch (_) {
      installingByPluginName = true
    }

    if (installingByPluginName) {
      dispatch(
        createPluginChangeStatusAction({
          packageName: packageSource,
          option: [{ path: 'isUpdating', status: true }],
        }),
      )
    }

    try {
      const npmConfig = getNpmConfig(PLUGIN_PATH)
      await installPackage(packageSource, version, npmConfig)
    } catch (e) {
      this.emit('installfailed', packageSource)
      console.error(e instanceof Error ? e.stack : e)
      throw e
    }

    const packageName = installingByPluginName
      ? packageSource
      : await findInstalledTarball(join(PLUGIN_PATH, 'node_modules'), packageSource)

    const nowPlugin = getPlugins().find((plugin) => plugin.packageName === packageName)
    if (nowPlugin) {
      try {
        unloadPlugin(nowPlugin)
      } catch (error) {
        console.error(error instanceof Error ? error.stack : error)
      }
    }

    try {
      let plugin = await readPlugin(getPluginPath(packageName))
      if (plugin.enabled) {
        plugin = await enablePlugin(plugin, false)
      }
      dispatch(createPluginAddAction(plugin))
    } catch (error) {
      if (nowPlugin) {
        dispatch(
          createPluginChangeStatusAction({
            packageName: nowPlugin.packageName,
            option: [{ path: 'isUpdating', status: false }],
          }),
        )
      }
      console.error(error instanceof Error ? error.stack : error)
      throw error
    }
  }

  async uninstallPlugin(plugin: Plugin): Promise<void> {
    try {
      dispatch(
        createPluginChangeStatusAction({
          packageName: plugin.packageName,
          option: [{ path: 'isUninstalling', status: true }],
        }),
      )
      this.removePlugin(plugin)
    } catch (error) {
      console.error(error instanceof Error ? error.stack : error)
    }
    try {
      if (!plugin.isExtra) {
        const npmConfig = getNpmConfig(PLUGIN_PATH)
        await removePackage(plugin.packageName, npmConfig)
        await safePhysicallyRemove(getPluginPath(plugin.packageName))
      } else {
        await safePhysicallyRemove(getPluginExtraPath(plugin.packageName))
      }
    } catch (error) {
      console.error(error instanceof Error ? error.stack : error)
    }
  }

  async gracefulRepair(repair = true): Promise<void> {
    const plugins = this.getInstalledPlugins()
    const modulePath = join(PLUGIN_PATH, 'node_modules')
    await safePhysicallyRemove(modulePath)
    await ensureDir(modulePath)
    await Promise.all(plugins.map((plugin) => this.uninstallPlugin(plugin)))
    if (!repair) return
    await Promise.all(plugins.map((plugin) => this.installPlugin(plugin.packageName)))
  }

  async enablePlugin(plugin: Plugin): Promise<void> {
    plugin.enabled = true
    if (!plugin.isBroken) {
      plugin = await enablePlugin(plugin)
    }
    config.set(`plugin.${plugin.id}.enable`, true)
    dispatch(createPluginAddAction(plugin))
  }

  async disablePlugin(plugin: Plugin): Promise<void> {
    config.set(`plugin.${plugin.id}.enable`, false)
    plugin = await disablePlugin(plugin)
    dispatch(createPluginAddAction(plugin))
  }

  removePlugin(plugin: Plugin): void {
    try {
      plugin = unloadPlugin(plugin)
    } catch (error) {
      console.error(error instanceof Error ? error.stack : error)
    }
    dispatch(createPluginRemoveAction(plugin))
  }

  async reloadPlugin(plugin: Plugin): Promise<void> {
    try {
      await this.disablePlugin(plugin)
      plugin.isBroken = false
      await this.enablePlugin(plugin)
    } catch (error) {
      console.error(error instanceof Error ? error.stack : error)
    }
  }
}

const pluginManager = new PluginManager()

declare global {
  interface Window {
    reloadPlugin: (pkgName: string, verbose?: boolean) => Promise<void>
    gracefulResetPlugin: () => void
  }
}

window.reloadPlugin = async (pkgName: string, verbose = false) => {
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
export { isRecord, type NpmConfig, type Plugin }
