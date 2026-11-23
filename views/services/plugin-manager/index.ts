import type * as PluginInstallService from 'lib/plugin-install-service'
import type { InstalledPackageInfo } from 'lib/plugin-install-service'

import * as remote from '@electron/remote'
import EventEmitter from 'events'
import { existsSync, readJsonSync } from 'fs-extra'
import { glob } from 'glob'
import { map } from 'lodash'
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

import type { BundlePluginMeta, NpmConfig, Plugin } from './types'

import {
  closePluginWindows,
  disablePlugin,
  enablePlugin,
  notifyFailed,
  unloadPlugin,
} from './lifecycle'
import { getNpmConfig, removeExtraPackage } from './npm-utils'
import { normalizeInstallSpec } from './package-spec'
import { readPlugin } from './read-plugin'
import { isRecord } from './types'
import { resolvePluginUpdate } from './version'

const installer: typeof PluginInstallService = remote.require('./lib/plugin-install-service')

const PLUGIN_NAME_WILDCARD = 'poi-plugin-*'
const SCOPED_PLUGIN_NAME_WILDCARD = '@*/poi-plugin-*'
const PLUGIN_DATA_PATH = join(ROOT, 'assets', 'data', 'plugin.json')
const BUNDLED_PLUGINS: Record<string, BundlePluginMeta> = readJsonSync(PLUGIN_DATA_PATH)
const GLOB_OPTIONS = { windowsPathsNoEscape: true } as const

const getPluginPath = (packageName: string) => join(PLUGIN_PATH, 'node_modules', packageName)
const getPluginExtraPath = (packageName: string) =>
  join(PLUGIN_EXTRA_PATH, 'node_modules', packageName)

export interface RepairResult {
  packageName: string
  status: 'repaired' | 'skipped' | 'failed'
  reason?: string
  error?: string
}

interface InstallSpecOptions {
  packageName?: string
  registry?: string
  expected?: {
    type: 'registry' | 'file'
    integrity?: string
  }
}

interface RepairTarget {
  packageName: string
  path: string
  spec: string
  registry?: string
  expected?: InstallSpecOptions['expected']
  skip?: string
}

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

  private async readFromWildcardPath(pluginRoot: string, isExtra = false): Promise<Plugin[]> {
    const nodeModules = join(pluginRoot, 'node_modules')
    const patterns = [
      join(nodeModules, PLUGIN_NAME_WILDCARD),
      join(nodeModules, SCOPED_PLUGIN_NAME_WILDCARD),
    ]
    const pluginPaths = (
      await Promise.all(
        patterns.map((pattern) => glob(pattern, GLOB_OPTIONS).catch(() => [] as string[])),
      )
    ).flat()

    const plugins: Plugin[] = []
    for (const pluginPath of pluginPaths) {
      try {
        plugins.push(await this.readInstalledPlugin(pluginPath, isExtra))
      } catch (error) {
        // A directory with a broken manifest should not hide the other plugins.
        console.error(error instanceof Error ? error.stack : error)
      }
    }
    return sortPlugins(plugins)
  }

  private async readInstalledPlugin(pluginPath: string, isExtra: boolean): Promise<Plugin> {
    const plugin = await readPlugin(pluginPath, isExtra)
    return { ...plugin, ...(await this.describeInstall(plugin)) }
  }

  private async describeInstall(
    plugin: Plugin,
  ): Promise<Pick<Plugin, 'installSource' | 'installSourceSpec' | 'installRegistry'>> {
    try {
      const info: InstalledPackageInfo = await installer.inspectPluginInstall(plugin.packageName)
      return {
        installSource: info.installSource,
        installSourceSpec: info.spec,
        installRegistry:
          info.receipt?.source.type === 'registry' ? info.receipt.source.registry : info.registry,
      }
    } catch (error) {
      console.error(error instanceof Error ? error.stack : error)
      return { installSource: 'unknown' }
    }
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
    const plugins = await this.readFromWildcardPath(PLUGIN_PATH)
    const extraPlugins = await this.readFromWildcardPath(PLUGIN_EXTRA_PATH, true)
    const enabledPlugins = await this.enablePlugins(this.mergePlugins(plugins, extraPlugins))
    notifyFailed(enabledPlugins, getNpmConfig(PLUGIN_PATH))
    dispatch(createPluginInitializeAction(enabledPlugins))
    return enabledPlugins
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

  private canUpdate(plugin: Plugin): boolean {
    return (
      plugin.isInstalled &&
      !plugin.isExtra &&
      !plugin.linkedPlugin &&
      (plugin.installSource === 'registry' || plugin.installSource === 'legacy-registry')
    )
  }

  getPluginOutdateInfo = async (plugin: Plugin): Promise<Plugin | undefined> => {
    if (plugin.needRollback || !this.canUpdate(plugin)) return undefined
    const npmConfig = getNpmConfig(PLUGIN_PATH)
    const viewOptions = {
      name: plugin.packageName,
      registry: plugin.installRegistry ?? npmConfig.registry,
      proxy: npmConfig.http_proxy,
      env: npmConfig.env,
    }
    const latestManifest = await installer.viewPackage({ ...viewOptions, tag: 'latest' })
    if (!latestManifest) {
      console.warn(`Can't find update info of plugin ${plugin.packageName}`)
      return undefined
    }
    const betaManifest = npmConfig.enableBetaPluginCheck
      ? await installer.viewPackage({ ...viewOptions, tag: 'beta' })
      : undefined

    const resolution = resolvePluginUpdate(
      plugin.version,
      window.POI_VERSION,
      latestManifest,
      betaManifest,
      npmConfig.enableBetaPluginCheck,
      plugin.apiVer,
    )
    if (!resolution.outdated) return undefined

    dispatch(
      createPluginChangeStatusAction({
        packageName: plugin.packageName,
        option: [
          { path: 'isOutdated', status: true },
          { path: 'latestVersion', status: resolution.latestVersion },
        ],
      }),
    )
    return plugin
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

  private setStatus(packageName: string, path: keyof Plugin, status: boolean): void {
    dispatch(
      createPluginChangeStatusAction({
        packageName,
        option: [{ path, status }],
      }),
    )
  }

  private async installSpec(spec: string, options: InstallSpecOptions = {}): Promise<void> {
    const npmConfig = getNpmConfig(PLUGIN_PATH)
    const hintedName = options.packageName ?? normalizeInstallSpec(spec).packageName
    const hinted = hintedName
      ? getPlugins().find((plugin) => plugin.packageName === hintedName)
      : undefined
    if (hinted) this.setStatus(hinted.packageName, 'isUpdating', true)

    let prepared
    try {
      prepared = await installer.preparePluginInstall({
        spec,
        registry: options.registry ?? npmConfig.registry,
        proxy: npmConfig.http_proxy,
        env: npmConfig.env,
        cwd: ROOT,
        expected: options.expected,
      })
    } catch (error) {
      if (hinted) this.setStatus(hinted.packageName, 'isUpdating', false)
      this.emit('installfailed', hintedName ?? spec)
      throw error
    }

    // An extra package may reuse the same plugin id; it must not be treated as
    // the previous instance of this normal package.
    const previous = getPlugins().find(
      (plugin) => plugin.packageName === prepared.packageName && !plugin.isExtra,
    )
    try {
      if (previous) {
        unloadPlugin(previous)
        await closePluginWindows(previous)
      }
      const installed = await installer.activatePluginInstall(prepared.operationId)
      const pluginPath = getPluginPath(installed.packageName)
      let plugin = await readPlugin(pluginPath)
      plugin = { ...plugin, ...(await this.describeInstall(plugin)) }

      const shadow = this.findExtraShadow(plugin)
      if (shadow) {
        // Keep the extra selected and running. The normal install stays on disk
        // for when the extra is removed, but must not spawn a duplicate id.
        const staleNormal = getPlugins().find(
          (candidate) => !candidate.isExtra && candidate.packageName === plugin.packageName,
        )
        if (staleNormal) dispatch(createPluginRemoveAction(staleNormal))
        return
      }

      if (plugin.enabled && !window.isSafeMode) {
        plugin = await enablePlugin(plugin, false)
      }
      dispatch(createPluginAddAction(plugin))
      if (plugin.isBroken) {
        window.toast(`${plugin.name} ${i18next.t('setting:PluginLoadFailed')}`, {
          type: 'error',
          title: i18next.t('setting:Plugin error'),
        })
      }
    } catch (error) {
      // Activation may have removed the old directory before failing. Drop the
      // stale installed entry so the UI offers the ordinary install retry.
      if (!existsSync(getPluginPath(prepared.packageName))) {
        const stale = getPlugins().find(
          (candidate) => candidate.packageName === prepared.packageName && !candidate.isExtra,
        )
        if (stale) dispatch(createPluginRemoveAction(stale))
      }
      this.emit('installfailed', prepared.packageName)
      console.error(error instanceof Error ? error.stack : error)
      throw error
    } finally {
      this.setStatus(prepared.packageName, 'isUpdating', false)
    }
  }

  private findExtraShadow(plugin: Plugin): Plugin | undefined {
    return getPlugins().find(
      (candidate) =>
        candidate.isExtra &&
        (candidate.id === plugin.id || candidate.packageName === plugin.packageName),
    )
  }

  async installPlugin(packageSource: string, version?: string): Promise<void> {
    const { spec } = normalizeInstallSpec(packageSource, version)
    await this.installSpec(spec)
  }

  async uninstallPlugin(plugin: Plugin): Promise<void> {
    dispatch(
      createPluginChangeStatusAction({
        packageName: plugin.packageName,
        option: [{ path: 'isUninstalling', status: true }],
      }),
    )
    try {
      if (plugin.isInstalled) {
        unloadPlugin(plugin)
        await closePluginWindows(plugin)
      }

      if (plugin.isExtra) {
        const result = await removeExtraPackage(getPluginExtraPath(plugin.packageName))
        if (!result.removed) {
          throw new Error(`Failed to remove extra plugin ${plugin.packageName}`)
        }
      } else {
        const result = await installer.removePluginDirectory(plugin.packageName)
        if (!result.removed) {
          throw new Error(`Failed to remove plugin ${plugin.packageName}`)
        }
      }
      // Only leave the UI after the disk operation succeeded.
      dispatch(createPluginRemoveAction(plugin))
      if (plugin.isExtra) await this.revealShadowedPlugin(plugin.packageName)
    } catch (error) {
      this.setStatus(plugin.packageName, 'isUninstalling', false)
      // The disk operation failed, so keep the plugin usable instead of leaving
      // the UI showing an enabled but unloaded plugin.
      if (plugin.isInstalled && plugin.enabled && !window.isSafeMode) {
        try {
          const restored = await enablePlugin({ ...plugin, isBroken: false })
          dispatch(createPluginAddAction(restored))
        } catch (restoreError) {
          console.error(restoreError instanceof Error ? restoreError.stack : restoreError)
        }
      }
      console.error(error instanceof Error ? error.stack : error)
      throw error
    }
  }

  /** Removes the extra override in the UI so the normal install shows up again. */
  private async revealShadowedPlugin(packageName: string): Promise<void> {
    const pluginPath = getPluginPath(packageName)
    if (!existsSync(pluginPath)) return
    try {
      let plugin = await this.readInstalledPlugin(pluginPath, false)
      if (plugin.enabled && !window.isSafeMode) plugin = await enablePlugin(plugin)
      dispatch(createPluginAddAction(plugin))
    } catch (error) {
      console.error(error instanceof Error ? error.stack : error)
    }
  }

  private async repairTarget(plugin: Plugin): Promise<RepairTarget> {
    const base: RepairTarget = {
      packageName: plugin.packageName,
      path: plugin.pluginPath,
      spec: plugin.packageName,
    }
    if (plugin.isExtra) return { ...base, skip: 'extra' }
    if (plugin.linkedPlugin || !existsSync(plugin.pluginPath)) {
      return { ...base, skip: 'linked' }
    }
    if (existsSync(join(plugin.pluginPath, '.git'))) return { ...base, skip: 'git' }

    const info: InstalledPackageInfo = await installer.inspectPluginInstall(plugin.packageName)
    if (info.installSource === 'unknown' || !info.spec) return { ...base, skip: 'unknown' }

    const receipt = info.receipt
    return {
      ...base,
      spec: info.spec,
      registry: receipt?.source.type === 'registry' ? receipt.source.registry : info.registry,
      expected: receipt
        ? { type: receipt.source.type, integrity: receipt.source.integrity }
        : undefined,
    }
  }

  /**
   * Two different batch operations: reset uninstalls each plugin individually,
   * repair reinstalls each from a snapshot of its real name, source, path and
   * version. Neither deletes the plugin root, and an unknown source is never
   * treated as a public registry package.
   */
  async gracefulRepair(repair = true): Promise<RepairResult[]> {
    const plugins = this.getInstalledPlugins()
    if (!repair) {
      // Reset removes each plugin individually; it never deletes the plugin root
      // or silently wipes extra/dev entries it does not understand.
      for (const plugin of plugins) {
        try {
          await this.uninstallPlugin(plugin)
        } catch (error) {
          console.error(error instanceof Error ? error.stack : error)
        }
      }
      return []
    }

    const results: RepairResult[] = []
    for (const plugin of plugins) {
      try {
        const target = await this.repairTarget(plugin)
        if (target.skip) {
          results.push({
            packageName: target.packageName,
            status: 'skipped',
            reason: target.skip,
          })
          continue
        }
        if (!existsSync(target.path)) {
          results.push({ packageName: target.packageName, status: 'skipped', reason: 'missing' })
          continue
        }
        await this.installSpec(target.spec, {
          packageName: target.packageName,
          registry: target.registry,
          expected: target.expected,
        })
        results.push({ packageName: target.packageName, status: 'repaired' })
      } catch (error) {
        // One corrupt manifest or failed lookup must not cancel the batch.
        results.push({
          packageName: plugin.packageName,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
    return results
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

window.gracefulResetPlugin = () => {
  void pluginManager.gracefulRepair(false)
}

remote.getCurrentWebContents().once('dom-ready', () => pluginManager.initialize())

export default pluginManager
export { isRecord, type NpmConfig, type Plugin }
