import * as remote from '@electron/remote'
import EventEmitter from 'events'
import { existsSync } from 'fs'
import { ensureDir, move, readJsonSync } from 'fs-extra'
import { rmdir } from 'fs/promises'
import { glob } from 'glob'
import { map } from 'lodash'
import fetch from 'node-fetch'
import { basename, dirname, join } from 'path'
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
  readPlugin,
  enablePlugin,
  disablePlugin,
  unloadPlugin,
  notifyFailed,
  safePhysicallyRemove,
  getNpmConfig,
  resolveRegistryPluginSpec,
  stagePluginPackage,
  isRecord,
} from './utils'

const defaultFetchOption = {
  method: 'GET',
  cache: 'default' as RequestCache,
  headers: {
    'Cache-Control': 'max-age=0',
  },
}

const PLUGIN_NAME_PATTERNS = ['poi-plugin-*', '@*/poi-plugin-*']
const PACKAGE_JSON_PATH = join(PLUGIN_PATH, 'package.json')
const PACKAGE_LOCK_PATH = join(PLUGIN_PATH, 'package-lock.json')
const PLUGIN_NODE_MODULES_PATH = join(PLUGIN_PATH, 'node_modules')
const getPluginPath = (packageName: string) => join(PLUGIN_PATH, 'node_modules', packageName)
const getPluginExtraPath = (packageName: string) =>
  join(PLUGIN_EXTRA_PATH, 'node_modules', packageName)
const PLUGIN_DATA_PATH = join(ROOT, 'assets', 'data', 'plugin.json')
const BUNDLED_PLUGINS: Record<string, BundlePluginMeta> = readJsonSync(PLUGIN_DATA_PATH)

const getPlugins = () => getStore('plugins')

export interface PluginRepairResult {
  succeeded: string[]
  failed: Array<{ packageName: string; error: string }>
}

class PluginManager extends EventEmitter {
  readonly VALID = 0
  readonly DISABLED = 1
  readonly NEEDUPDATE = 2
  readonly BROKEN = 3

  private operationQueue: Promise<unknown> = Promise.resolve()

  async initialize(): Promise<void> {
    await this.getPlugins()
    this.emit('initialized')
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.operationQueue.then(operation, operation)
    // Keep the queue resolved even when an operation rejects, so one failed
    // install cannot poison every later plugin-management action.
    this.operationQueue = next.then(
      () => undefined,
      () => undefined,
    )
    return next
  }

  private async readFromWildcardPath(wildcardPath: string, isExtra = false): Promise<Plugin[]> {
    // matches the previous callback form, which swallowed glob errors and yielded an empty list
    const pluginPaths = await glob(wildcardPath, { windowsPathsNoEscape: true }).catch(() => [])
    return sortPlugins(await Promise.all(pluginPaths.map((p) => readPlugin(p, isExtra))))
  }

  private async readPluginDirectories(basePath: string, isExtra = false): Promise<Plugin[]> {
    const paths = await Promise.all(
      PLUGIN_NAME_PATTERNS.map((pattern) =>
        this.readFromWildcardPath(join(basePath, 'node_modules', pattern), isExtra),
      ),
    )
    return sortPlugins(paths.flat())
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

  async readPlugins(): Promise<Plugin[]> {
    const plugins = await this.readPluginDirectories(PLUGIN_PATH)
    const extraPlugins = await this.readPluginDirectories(PLUGIN_EXTRA_PATH, true)
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
    const rawData: unknown = await fetch(
      `${npmConfig.registry}${plugin.packageName}/latest`,
      defaultFetchOption,
    )
      .then((res) => (res.ok ? res.json() : undefined))
      .catch(() => undefined)
    const data = isRecord(rawData) ? rawData : undefined
    if (!data?.['version']) {
      console.warn(`Can't find update info of plugin ${plugin.packageName}`)
      return undefined
    }

    const distTag: Record<string, string> = {
      latest: typeof data['version'] === 'string' ? data['version'] : plugin.version,
    }
    if (npmConfig.enableBetaPluginCheck) {
      const innerNpmConfig = getNpmConfig(PLUGIN_PATH)
      const rawBetaData: unknown = await fetch(
        `${innerNpmConfig.registry}${plugin.packageName}/beta`,
        defaultFetchOption,
      )
        .then((res) => (res.ok ? res.json() : undefined))
        .catch(() => undefined)
      const betaData = isRecord(rawBetaData) ? rawBetaData : undefined
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
      window.toast(content, { type: 'info', title: i18next.t('Plugin update') })
    }
  }

  private updatePluginStatus(
    packageName: string,
    path: 'isUpdating' | 'isUninstalling',
    status: boolean,
  ): void {
    dispatch(
      createPluginChangeStatusAction({
        packageName,
        option: [{ path, status }],
      }),
    )
  }

  private reportInstallFailure(packageSource: string, error: unknown): void {
    console.error(error instanceof Error ? error.stack : error)
    this.emit('installfailed', packageSource, error)
  }

  private markPluginUnloaded(plugin: Plugin, isUpdating = false): void {
    try {
      unloadPlugin(plugin)
    } catch (error) {
      console.error(error instanceof Error ? error.stack : error)
    }
    dispatch(
      createPluginAddAction({
        ...plugin,
        enabled: false,
        ...(isUpdating ? { isUpdating: true } : {}),
      }),
    )
  }

  private buildBrokenPlugin(packageName: string, previous?: Plugin, isExtra = false): Plugin {
    const pluginPath = isExtra ? getPluginExtraPath(packageName) : getPluginPath(packageName)
    const base: Plugin = previous ?? {
      packageData: { name: packageName },
      packageName,
      name: packageName,
      id: packageName,
      author: 'unknown',
      link: 'https://github.com/poooi',
      description: '',
      pluginPath,
      icon: 'fa/th-large',
      version: '0.0.0',
      latestVersion: '0.0.0',
      earliestCompatibleMain: '0.0.0',
      lastApiVer: '0.0.0',
      priority: 10000,
      enabled: false,
      isExtra,
      isInstalled: true,
      isUpdating: false,
      needRollback: false,
      isOutdated: false,
      displayIcon: null,
      displayName: packageName,
      timestamp: Date.now(),
      isRead: false,
    }
    return {
      ...base,
      pluginPath,
      enabled: false,
      isInstalled: true,
      isBroken: true,
      isUpdating: false,
      isUninstalling: false,
    }
  }

  /**
   * Make Redux reflect the actual directory left behind by a failed replace or
   * removal. Never leave a missing plugin looking installed, or a leftover
   * directory looking enabled.
   */
  private async syncAfterFailure(
    packageName: string,
    previous?: Plugin,
    isExtra = false,
    loadError?: string,
  ): Promise<void> {
    const targetPath = isExtra ? getPluginExtraPath(packageName) : getPluginPath(packageName)
    if (!existsSync(targetPath)) {
      if (previous) dispatch(createPluginRemoveAction(previous))
      return
    }

    let base = previous
    if (!base) {
      try {
        base = await readPlugin(targetPath, isExtra)
      } catch (_) {
        base = undefined
      }
    }
    const broken = this.buildBrokenPlugin(packageName, base, isExtra)
    dispatch(
      createPluginAddAction({
        ...broken,
        ...(loadError ? { loadError } : {}),
      }),
    )
  }

  private async removeEmptyScopeDirectory(targetPath: string): Promise<void> {
    const parent = dirname(targetPath)
    if (!basename(parent).startsWith('@')) return
    await rmdir(parent).catch(() => undefined)
  }

  private async installPluginInternal(packageSource: string, version?: string): Promise<void> {
    let resolved
    try {
      resolved = resolveRegistryPluginSpec(packageSource, version)
    } catch (error) {
      this.reportInstallFailure(packageSource, error)
      throw error
    }

    const { packageName, spec } = resolved
    const nowPlugin = getPlugins().find((plugin) => plugin.packageName === packageName)
    if (nowPlugin) {
      this.updatePluginStatus(packageName, 'isUpdating', true)
    }

    let staged
    try {
      const npmConfig = getNpmConfig(PLUGIN_PATH)
      staged = await stagePluginPackage(packageName, spec, npmConfig)
    } catch (error) {
      if (nowPlugin) {
        this.updatePluginStatus(packageName, 'isUpdating', false)
      }
      this.reportInstallFailure(packageName, error)
      throw error
    }

    try {
      if (nowPlugin) {
        // Unload before touching the directory on disk.
        this.markPluginUnloaded(nowPlugin, true)
      }

      const targetPath = getPluginPath(packageName)
      try {
        await safePhysicallyRemove(targetPath)
        await ensureDir(dirname(targetPath))
        await move(staged.pluginPath, targetPath)
      } catch (error) {
        await this.syncAfterFailure(packageName, nowPlugin)
        this.reportInstallFailure(packageName, error)
        throw error
      }

      try {
        let plugin = await readPlugin(targetPath)
        if (plugin.enabled && !window.isSafeMode) {
          plugin = await enablePlugin(plugin, false)
        }
        if (plugin.isBroken) {
          throw new Error(
            `Plugin ${packageName} failed to load${plugin.loadError ? `: ${plugin.loadError}` : '.'}`,
          )
        }
        dispatch(createPluginAddAction({ ...plugin, isUpdating: false }))
      } catch (error) {
        const loadError = error instanceof Error ? error.message : String(error)
        await this.syncAfterFailure(packageName, undefined, false, loadError)
        this.reportInstallFailure(packageName, error)
        throw error
      }
    } finally {
      await staged.cleanup()
    }
  }

  async installPlugin(packageSource: string, version?: string): Promise<void> {
    return this.enqueue(() => this.installPluginInternal(packageSource, version))
  }

  private async uninstallPluginInternal(plugin: Plugin): Promise<void> {
    // A queued removal may have been requested with an older Plugin object;
    // unload the instance that is actually current in Redux.
    const currentPlugin =
      getPlugins().find((stored) => stored.packageName === plugin.packageName) ?? plugin
    this.updatePluginStatus(currentPlugin.packageName, 'isUninstalling', true)
    try {
      unloadPlugin(currentPlugin)
    } catch (error) {
      console.error(error instanceof Error ? error.stack : error)
    }
    dispatch(createPluginAddAction({ ...currentPlugin, enabled: false, isUninstalling: true }))

    const targetPath = currentPlugin.isExtra
      ? getPluginExtraPath(currentPlugin.packageName)
      : getPluginPath(currentPlugin.packageName)
    try {
      await safePhysicallyRemove(targetPath)
      if (existsSync(targetPath)) {
        throw new Error(`Failed to remove plugin directory ${targetPath}.`)
      }
    } catch (error) {
      await this.syncAfterFailure(currentPlugin.packageName, currentPlugin, currentPlugin.isExtra)
      throw error
    }

    dispatch(createPluginRemoveAction(currentPlugin))
    await this.removeEmptyScopeDirectory(targetPath)
  }

  async uninstallPlugin(plugin: Plugin): Promise<void> {
    return this.enqueue(() => this.uninstallPluginInternal(plugin))
  }

  private syncAfterRepairFailure(plugins: Plugin[]): void {
    for (const plugin of plugins) {
      if (!existsSync(getPluginPath(plugin.packageName))) {
        dispatch(createPluginRemoveAction(plugin))
        continue
      }
      dispatch(
        createPluginAddAction({
          ...plugin,
          enabled: false,
          isUpdating: false,
          isUninstalling: false,
        }),
      )
    }
  }

  private async gracefulRepairInternal(repair: boolean): Promise<PluginRepairResult> {
    const plugins = this.getInstalledPlugins().filter((plugin) => !plugin.isExtra)

    // Unload everything first, so no stale running instance survives the wipe.
    for (const plugin of plugins) {
      try {
        unloadPlugin(plugin)
      } catch (error) {
        console.error(error instanceof Error ? error.stack : error)
      }
      dispatch(createPluginAddAction({ ...plugin, enabled: false }))
    }

    try {
      await safePhysicallyRemove(PLUGIN_NODE_MODULES_PATH)
      await safePhysicallyRemove(PACKAGE_JSON_PATH)
      await safePhysicallyRemove(PACKAGE_LOCK_PATH)
      if (existsSync(PLUGIN_NODE_MODULES_PATH)) {
        throw new Error(`Failed to clear plugin directory ${PLUGIN_NODE_MODULES_PATH}.`)
      }
      await ensureDir(PLUGIN_NODE_MODULES_PATH)
    } catch (error) {
      this.syncAfterRepairFailure(plugins)
      throw error
    }

    for (const plugin of plugins) {
      dispatch(createPluginRemoveAction(plugin))
    }
    if (!repair) return { succeeded: [], failed: [] }

    const result: PluginRepairResult = { succeeded: [], failed: [] }
    for (const plugin of plugins) {
      if (plugin.linkedPlugin) continue
      try {
        await this.installPluginInternal(plugin.packageName)
        result.succeeded.push(plugin.packageName)
      } catch (error) {
        result.failed.push({
          packageName: plugin.packageName,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
    return result
  }

  async gracefulRepair(repair = true): Promise<PluginRepairResult> {
    return this.enqueue(() => this.gracefulRepairInternal(repair))
  }

  async enablePlugin(plugin: Plugin): Promise<void> {
    plugin = { ...plugin, enabled: true }
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
      await this.enablePlugin({ ...plugin, isBroken: false })
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

export { PluginManager }
export default pluginManager
export { isRecord, type NpmConfig, type Plugin }
