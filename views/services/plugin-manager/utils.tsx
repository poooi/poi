import type { BrowserWindowConstructorOptions } from 'electron'
import type { FC } from 'react'

import * as remote from '@electron/remote'
import FontAwesome from '@skagami/react-fontawesome'
import child_process from 'child_process'
import crypto from 'crypto'
import {
  createReadStream,
  readJson,
  accessSync,
  realpathSync,
  lstat,
  unlink,
  remove,
  lstatSync,
} from 'fs-extra'
import glob from 'glob'
import { omit, each } from 'lodash-es'
import { Module } from 'module'
import { join, basename } from 'path'
import React from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-remarkable'
import semver from 'semver'
import { pathToFileURL } from 'url'
import { promisify } from 'util'
import { appMenu } from 'views/components/etc/menu'
import { extendReducer } from 'views/create-store'
import { config, ROOT } from 'views/env'
import i18next, { addGlobalI18n, addResourceBundleDebounce } from 'views/env-parts/i18next'
import { pluginRequire } from 'views/env-parts/plugin-require'
import { readI18nResources, normalizeURL } from 'views/utils/tools'

const windowManager = remote.require('./lib/window')
const utils = remote.require('./lib/utils')

const NPM_EXEC_PATH = join(ROOT, 'node_modules', 'npm', 'bin', 'npm-cli.js')
const MIRROR_JSON_PATH = join(ROOT, 'assets', 'data', 'mirror.json')
const MIRRORS: Record<string, { server: string }> = require(MIRROR_JSON_PATH)

const clearReducer = undefined

const globAsync = promisify(glob)

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function getString(obj: Record<string, unknown>, key: string): string | undefined {
  const val = obj[key]
  return typeof val === 'string' ? val : undefined
}

function getNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const val = obj[key]
  return typeof val === 'number' ? val : undefined
}

// Walk exports["."].require / exports["."].import to find the dual-package entry path.
// The condition object can be a plain string or a nested { default, node, ... } map.
function resolveExportsCondition(
  packageData: Record<string, unknown>,
  condition: 'require' | 'import',
): string | undefined {
  const rawExports = packageData['exports']
  if (!isRecord(rawExports)) return undefined
  // exports can be { '.': { require: ... } } or directly { require: ... }
  const dotEntry = isRecord(rawExports['.']) ? rawExports['.'] : rawExports
  if (!isRecord(dotEntry)) return undefined
  const entry = dotEntry[condition]
  if (typeof entry === 'string') return entry
  if (isRecord(entry)) {
    const v = entry['default'] ?? entry['node']
    if (typeof v === 'string') return v
  }
  return undefined
}

function toStringRecord(obj: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(obj).filter((e): e is [string, string] => typeof e[1] === 'string'),
  )
}

export interface NpmConfig {
  registry: string
  prefix: string
  enableBetaPluginCheck: boolean
  http_proxy?: string
}

export interface PluginWindow {
  setMenu: (menu: unknown) => void
  setAutoHideMenuBar: (v: boolean) => void
  setMenuBarVisibility: (v: boolean) => void
  loadURL: (url: string) => void
  show: () => void
  on: (event: string, callback: () => void) => void
}

export interface Plugin {
  packageData: Record<string, unknown>
  packageName: string
  name: string
  id: string
  author: string
  link: string
  description: React.ReactNode | string
  pluginPath: string
  linkedPlugin?: boolean
  icon: string | string[]
  version: string
  latestVersion: string
  earliestCompatibleMain: string
  lastApiVer: string
  priority: number
  enabled: boolean
  isExtra: boolean
  isInstalled: boolean
  isUpdating: boolean
  needRollback: boolean
  apiVer?: Record<string, string>
  isOutdated: boolean
  displayIcon: React.JSX.Element | null
  displayName: React.ReactNode
  timestamp: number
  isBroken?: boolean
  isRead?: boolean
  isUninstalling?: boolean
  windowURL?: string
  multiWindow?: boolean
  realClose?: boolean
  reducer?: unknown
  reactClass?: React.ComponentType
  settingsClass?: React.ComponentType
  switchPluginPath?: string[]
  windowOptions?: BrowserWindowConstructorOptions
  pluginWindow?: PluginWindow | null
  handleClick?: () => void
  pluginDidLoad?: () => void
  pluginWillUnload?: () => void
  i18nDir?: string
  title?: string
  windowMode?: boolean
}

interface BundlePluginI18n {
  'zh-CN': string
  'zh-TW': string
  'ja-JP': string
  'en-US': string
  'ko-KR': string
}

export interface BundlePluginMeta {
  name: BundlePluginI18n
  version: string
  icon: string
  author: string
  link: string
  description: BundlePluginI18n
}

type PluginDataEntry = {
  link?: string
  version?: string
  [key: string]: unknown
}

function calculateShasum(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const hash = crypto.createHash('sha1')
      const stream = createReadStream(filePath)
      stream.on('data', (data) => hash.update(data.toString(), 'utf8'))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', (e) => reject(e))
    } catch (e) {
      reject(e)
    }
  })
}

export const findInstalledTarball = async (
  pluginRoot: string,
  tarballPath: string,
): Promise<string> => {
  const filename = basename(tarballPath)
  const pluginPaths = await globAsync(join(pluginRoot, 'poi-plugin-*'))
  const packageDatas: Array<Record<string, unknown>> = await Promise.all(
    pluginPaths.map((p) => readJson(join(p, 'package.json'))),
  )
  const nameMatchDatas = packageDatas.filter((packageData) => {
    const requested = packageData['_requested']
    const raw = isRecord(requested) ? (getString(requested, 'raw') ?? '') : ''
    return raw.endsWith(filename)
  })
  if (nameMatchDatas.length === 1) {
    const name = nameMatchDatas[0]['name']
    if (typeof name !== 'string') throw new Error(`Invalid package name in ${pluginRoot}`)
    return name
  }
  if (nameMatchDatas.length === 0) {
    throw new Error(`Error: Can't find a package matching ${tarballPath}.`)
  }
  const shasum = await calculateShasum(tarballPath)
  const shasumMatchDatas = nameMatchDatas.filter((data) => data['_shasum'] === shasum)
  if (!shasumMatchDatas[0]) {
    throw new Error(
      `Error: Can't find a package installed from ${tarballPath} matching shasum ${shasum}.`,
    )
  }
  const name = shasumMatchDatas[0]['name']
  if (typeof name !== 'string') throw new Error(`Invalid package name in ${pluginRoot}`)
  return name
}

const runScriptAsync = (
  scriptPath: string,
  args: string[],
  options: child_process.ForkOptions,
): Promise<void> =>
  new Promise((resolve) => {
    const proc = child_process.fork(scriptPath, args, options)
    proc.on('exit', () => resolve())
  })

export async function installPackage(
  packageName: string,
  version: string | null | undefined,
  npmConfig: NpmConfig,
): Promise<void> {
  if (!packageName) return
  const target = version ? `${packageName}@${version}` : packageName
  let args = ['install', '--registry', npmConfig.registry]
  if (npmConfig.http_proxy) {
    args = [...args, '--proxy', npmConfig.http_proxy]
  }
  args = [
    ...args,
    '--no-progress',
    '--no-prune',
    '--global-style',
    '--ignore-scripts',
    '--legacy-peer-deps',
    target,
  ]
  await runScriptAsync(NPM_EXEC_PATH, args, { cwd: npmConfig.prefix })
}

export async function removePackage(target: string, npmConfig: NpmConfig): Promise<void> {
  const args = ['uninstall', '--no-progress', target]
  await runScriptAsync(NPM_EXEC_PATH, args, { cwd: npmConfig.prefix })
  await repairDep([], npmConfig)
}

export function updateI18n(plugin: Plugin): Plugin {
  let i18nFile: string | null = null
  if (plugin.i18nDir != null) {
    i18nFile = join(plugin.pluginPath, plugin.i18nDir)
  } else {
    try {
      accessSync(join(plugin.pluginPath, 'i18n'))
      i18nFile = join(plugin.pluginPath, 'i18n')
    } catch (_) {
      try {
        accessSync(join(plugin.pluginPath, 'assets', 'i18n'))
        i18nFile = join(plugin.pluginPath, 'assets', 'i18n')
      } catch (_error) {
        console.warn(`${plugin.packageName}: No translate file found.`)
      }
    }
  }
  if (i18nFile != null) {
    const namespace = plugin.id
    const i18nFilePath = i18nFile
    each(
      window.LOCALES.map((lng) => lng.locale),
      (lng) => {
        addGlobalI18n(namespace)
        addResourceBundleDebounce(
          lng,
          namespace,
          readI18nResources(join(i18nFilePath, `${lng}.json`)),
          true,
          true,
        )
      },
    )
    return {
      ...plugin,
      name: i18next.t(`${namespace}:${plugin.name}`),
      description:
        typeof plugin.description === 'string'
          ? (i18next.t(`${namespace}:${plugin.description}`) satisfies string)
          : (plugin.description satisfies React.ReactNode),
    }
  }
  return plugin
}

const BundlePluginDisplayName: FC<BundlePluginMeta> = (meta) => {
  const { i18n } = useTranslation('setting')
  return (
    <>
      <FontAwesome name={meta.icon.split('/')[1] || meta.icon} />{' '}
      {/* @ts-expect-error the language is guaranteed to be a key of meta.name */}
      {meta.name[i18n.language] ?? meta.name['en-US']}
    </>
  )
}

const BundlePluginDescription: FC<BundlePluginMeta> = (meta) => {
  const { i18n } = useTranslation('setting')
  return (
    <ReactMarkdown
      options={{ linkTarget: '_blank' }}
      /* @ts-expect-error the language is guaranteed to be a key of meta.description */
      source={meta.description[i18n.language] ?? meta.description['en-US']}
    />
  )
}

export function bundlePluginMetaToPlugin(meta: BundlePluginMeta, packageName: string): Plugin {
  // @ts-expect-error the return type is guaranteed to match Plugin except for displayName and description which will be added later
  return {
    packageData: { name: packageName, version: meta.version },
    packageName,
    displayName: <BundlePluginDisplayName {...meta} />,
    description: <BundlePluginDescription {...meta} />,
    author: meta.author,
    version: meta.version,
    id: packageName,
  }
}

export async function readPlugin(pluginPath: string, isExtra = false): Promise<Plugin> {
  let pluginData: Record<string, PluginDataEntry> = {}
  let packageData: Record<string, unknown> = {}

  try {
    pluginData = await readJson(join(ROOT, 'assets', 'data', 'plugin.json'))
  } catch (error) {
    utils.error(error)
  }
  try {
    packageData = await readJson(join(pluginPath, 'package.json'))
  } catch (error) {
    utils.error(error)
  }

  const poiPlugin: Record<string, unknown> = isRecord(packageData['poiPlugin'])
    ? packageData['poiPlugin']
    : {}
  const cleanPackageData = omit(packageData, 'poiPlugin') as Record<string, unknown>

  const packageName = getString(cleanPackageData, 'name') ?? basename(pluginPath)
  if (!packageName.match(/poi-plugin-.+/)) {
    throw new Error(
      `Plugin package name "${packageName}" is invalid. It should start with "poi-plugin-".`,
    )
  }
  const name = getString(poiPlugin, 'name') ?? getString(poiPlugin, 'title') ?? packageName
  const id = getString(poiPlugin, 'id') ?? packageName

  const authorData = cleanPackageData['author']
  const authorObj = isRecord(authorData) ? authorData : undefined
  const author =
    typeof authorData === 'string' ? authorData : (getString(authorObj ?? {}, 'name') ?? 'unknown')

  const packageNameData = pluginData[packageName]
  const link =
    getString(authorObj ?? {}, 'links') ??
    getString(authorObj ?? {}, 'url') ??
    packageNameData?.link ??
    'https://github.com/poooi'

  const description =
    getString(poiPlugin, 'description') ??
    getString(cleanPackageData, 'description') ??
    String(packageNameData?.[`des${window.language}`] ?? 'unknown')

  const pluginRealPath = realpathSync(pluginPath)
  const pluginStat = lstatSync(pluginPath)
  const version = getString(cleanPackageData, 'version') ?? '0.0.0'

  const apiVerRaw = poiPlugin['apiVer']
  const apiVer: Record<string, string> | undefined = isRecord(apiVerRaw)
    ? toStringRecord(apiVerRaw)
    : undefined

  let needRollback = false
  let latestVersion = version
  if (apiVer) {
    let nearestCompVer = 'v214.748.3647'
    for (const mainVersion in apiVer) {
      if (
        semver.lte(window.POI_VERSION, mainVersion) &&
        semver.lt(mainVersion, nearestCompVer) &&
        semver.gt(version, apiVer[mainVersion])
      ) {
        needRollback = true
        nearestCompVer = mainVersion
        latestVersion = apiVer[mainVersion]
      }
    }
  }

  const enabled = config.get(`plugin.${id}.enable`, true)

  const iconRaw = poiPlugin['icon']
  const icon: string | string[] =
    typeof iconRaw === 'string'
      ? iconRaw
      : Array.isArray(iconRaw)
        ? iconRaw.filter((i): i is string => typeof i === 'string')
        : 'fa/th-large'

  let plugin: Plugin = {
    ...poiPlugin,
    packageData: cleanPackageData,
    packageName,
    name,
    id,
    author,
    link,
    description,
    pluginPath: pluginRealPath,
    ...(pluginStat.isSymbolicLink() && { linkedPlugin: true }),
    icon,
    version,
    latestVersion,
    earliestCompatibleMain: getString(poiPlugin, 'earliestCompatibleMain') ?? '0.0.0',
    lastApiVer: getString(poiPlugin, 'lastApiVer') ?? version,
    priority: getNumber(poiPlugin, 'priority') ?? 10000,
    enabled: Boolean(enabled),
    isExtra,
    isInstalled: true,
    isUpdating: false,
    needRollback,
    apiVer,
    isOutdated: needRollback,
    displayIcon: null,
    displayName: null,
    timestamp: Date.now(),
    i18nDir: getString(poiPlugin, 'i18nDir'),
    title: getString(poiPlugin, 'title'),
  }

  plugin = updateI18n(plugin)

  const iconStr = Array.isArray(plugin.icon)
    ? plugin.icon
    : plugin.icon.split('/')[1] || plugin.icon || 'th-large'
  plugin.displayIcon = Array.isArray(iconStr) ? (
    <FontAwesome icon={iconStr} />
  ) : (
    <FontAwesome name={iconStr} />
  )
  plugin.displayName = (
    <>
      {plugin.displayIcon} {plugin.name}
    </>
  )

  return plugin
}

export async function enablePlugin(plugin: Plugin, reread = true): Promise<Plugin> {
  if (plugin.needRollback) return plugin
  let pluginMain: Partial<Plugin>
  try {
    // Dual-package aware entry resolution:
    //   1. exports["."].require  — explicit CJS path for dual-package plugins
    //   2. "main" + extension variants — legacy single-format plugins
    //   3. index.* fallbacks
    //   4. exports["."].import  — ESM-only plugins (loaded via dynamic import)
    const mainFromPkg = getString(plugin.packageData, 'main')
    const cjsFromExports = resolveExportsCondition(plugin.packageData, 'require')
    const esmFromExports = resolveExportsCondition(plugin.packageData, 'import')

    const cjsCandidates: string[] = [
      ...(cjsFromExports ? [cjsFromExports] : []),
      ...(mainFromPkg
        ? [
            mainFromPkg,
            mainFromPkg.replace(/\.es$/, '.js'),
            mainFromPkg.replace(/\.js$/, '.es'),
            mainFromPkg.replace(/\.[jt]sx?$/, '.ts'),
            mainFromPkg.replace(/\.[jt]sx?$/, '.tsx'),
          ]
        : []),
      'index.js',
      'index.es',
      'index.ts',
      'index.tsx',
    ]

    let entryAbsPath: string | undefined
    for (const candidate of cjsCandidates) {
      const abs = join(plugin.pluginPath, candidate)
      try {
        // resolve() returns the real (symlink-resolved) path — use that as
        // entryAbsPath so cache deletion and require() both operate on the
        // same canonical key, even when pluginPath contains symlinks.
        entryAbsPath = pluginRequire.resolve(abs)
        break
      } catch {
        /* file not found, try next candidate */
      }
    }

    let rawImported: Record<string, unknown>
    if (esmFromExports) {
      // Prefer ESM: runs natively in V8 without Babel transpilation overhead.
      // ESM imports of CJS packages (react, react-redux, …) still route through
      // require.cache, so our bridged modules apply.
      // ?t= busts the ESM module cache so re-enabling a plugin loads fresh code.
      const esmAbsURL = `${pathToFileURL(join(plugin.pluginPath, esmFromExports)).href}?t=${Date.now()}`
      rawImported = await import(esmAbsURL)
    } else if (entryAbsPath) {
      // CJS fallback for legacy plugins (.js / .es / .ts without an exports field).
      // Clear require.cache so re-enabling loads fresh code.
      delete pluginRequire.cache[entryAbsPath]
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      rawImported = pluginRequire(entryAbsPath)
    } else {
      throw new Error(
        `No entry file found for plugin ${plugin.id} (pluginPath=${plugin.pluginPath}, main=${mainFromPkg})`,
      )
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const rawDefaultImport = rawImported?.default as Partial<Plugin> | undefined
    // CJS plugins compiled with __esModule:true expose their exports nested under .default;
    const imported: Partial<Plugin> =
      rawDefaultImport !== undefined &&
      typeof rawDefaultImport === 'object' &&
      (rawDefaultImport.handleClick !== undefined || rawDefaultImport.reactClass !== undefined)
        ? rawDefaultImport
        : rawImported
    const rereadData: Partial<Plugin> = reread
      ? await readPlugin(plugin.pluginPath, plugin.isExtra)
      : {}
    pluginMain = {
      ...imported,
      ...rereadData,
      enabled: true,
      isRead: true,
    }
    if (!plugin.id && pluginMain.name) {
      pluginMain.id = pluginMain.name
    }
  } catch (error) {
    console.error(error instanceof Error ? error.stack : error)
    pluginMain = { enabled: false, isBroken: true }
  }
  let result: Plugin = { ...plugin, ...pluginMain }
  if (result.windowURL) {
    const background = config.get(`poi.plugin.background.${result.id}`, !result.realClose)
    result.realClose = !background
  }
  result = postEnableProcess(result)
  return result
}

export async function disablePlugin(plugin: Plugin): Promise<Plugin> {
  let result: Plugin = { ...plugin, enabled: false }
  try {
    result = unloadPlugin(result)
  } catch (error) {
    console.error(error instanceof Error ? error.stack : error)
  }
  return result
}

const postEnableProcess = (plugin: Plugin): Plugin => {
  if (plugin.isBroken) return plugin

  if (plugin.reducer) {
    try {
      extendReducer(plugin.packageName, plugin.reducer)
    } catch (e) {
      console.error(e instanceof Error ? e.stack : e)
    }
  }

  if (plugin.windowURL) {
    const vibrancy =
      ['darwin'].includes(process.platform) && config.get('poi.appearance.vibrant', 0) === 1
        ? 'ultra-dark'
        : undefined

    const windowOptions = {
      x: config.get('poi.window.x', 0),
      y: config.get('poi.window.y', 0),
      width: 800,
      height: 600,
      webPreferences: {
        preload: join(ROOT, 'assets', 'js', 'plugin-preload.js'),
        plugins: true,
        webviewTag: true,
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
        nodeIntegrationInSubFrames: true,
        sandbox: false,
        enableRemoteModule: true,
        contextIsolation: false,
        affinity: 'poi-plugin',
        webSecurity: false,
        ...(isRecord(plugin.windowOptions?.webPreferences)
          ? plugin.windowOptions?.webPreferences
          : {}),
      },
      ...plugin.windowOptions,
      realClose: plugin.realClose,
      backgroundColor: '#E62A2A2A',
      vibrancy,
    }
    const windowURL = normalizeURL(plugin.windowURL)
    if (plugin.multiWindow) {
      plugin.handleClick = () => {
        const win: PluginWindow = windowManager.createWindow(windowOptions)
        win.setMenu(appMenu)
        win.setAutoHideMenuBar(true)
        win.setMenuBarVisibility(false)
        win.loadURL(windowURL)
        win.show()
      }
    } else if (plugin.realClose) {
      plugin.pluginWindow = null
      plugin.handleClick = () => {
        if (plugin.pluginWindow == null) {
          plugin.pluginWindow = windowManager.createWindow(windowOptions)
          plugin.pluginWindow?.setMenu(appMenu)
          plugin.pluginWindow?.setAutoHideMenuBar(true)
          plugin.pluginWindow?.setMenuBarVisibility(false)
          plugin.pluginWindow?.on('close', () => {
            plugin.pluginWindow = null
          })
          plugin.pluginWindow?.loadURL(windowURL)
          plugin.pluginWindow?.show()
        } else {
          plugin.pluginWindow.show()
        }
      }
    } else {
      plugin.pluginWindow = windowManager.createWindow(windowOptions)
      plugin.pluginWindow?.setMenu(appMenu)
      plugin.pluginWindow?.setAutoHideMenuBar(true)
      plugin.pluginWindow?.setMenuBarVisibility(false)
      plugin.pluginWindow?.loadURL(windowURL)
      plugin.handleClick = () => plugin.pluginWindow?.show()
    }
  }

  try {
    if (typeof plugin.pluginDidLoad === 'function') {
      plugin.pluginDidLoad()
    }
  } catch (error) {
    console.error(error instanceof Error ? error.stack : error)
  }
  return plugin
}

function clearPluginCache(packagePath: string): void {
  for (const p in require.cache) {
    if (p.includes(basename(packagePath))) {
      delete require.cache[p]
    }
  }
  // _pathCache is a Node.js internal not typed in @types/node
  type ModuleWithPathCache = typeof Module & { _pathCache?: Record<string, string | string[]> }
  const pathCache = (Module as ModuleWithPathCache)._pathCache
  for (const p in pathCache) {
    if (p.includes(basename(packagePath))) {
      delete pathCache[p]
    }
  }
}

export function unloadPlugin(plugin: Plugin): Plugin {
  try {
    if (typeof plugin.pluginWillUnload === 'function') {
      plugin.pluginWillUnload()
    }
  } catch (error) {
    console.error(error instanceof Error ? error.stack : error)
  }
  if (plugin.pluginWindow) {
    windowManager.closeWindow(plugin.pluginWindow)
  }
  clearPluginCache(plugin.pluginPath)
  extendReducer(plugin.packageName, clearReducer)
  return plugin
}

export function notifyFailed(state: Plugin[], npmConfig: NpmConfig): void {
  const plugins = state.filter((plugin) => plugin.isBroken)
  const unreadList: string[] = []
  const reinstallList: string[] = []
  for (const plugin of plugins) {
    unreadList.push(plugin.name)
    if (!plugin.linkedPlugin) reinstallList.push(plugin.packageName)
  }
  if (unreadList.length > 0) {
    const content = `${unreadList.join(' / ')} ${i18next.t('setting:PluginLoadFailed')}`
    window.toast(content, { type: 'error', title: i18next.t('setting:Plugin error') })
  }
  repairDep(reinstallList, npmConfig)
}

export async function repairDep(brokenList: string[], npmConfig: NpmConfig): Promise<void> {
  const depList = (
    await new Promise<string[]>((res) => {
      glob(join(npmConfig.prefix, 'node_modules', '*'), (err, matches) => res(matches ?? []))
    })
  ).filter((p) => !p.includes('poi-plugin'))
  depList.forEach((p) => {
    try {
      require(p)
    } catch (_) {
      safePhysicallyRemove(p)
    }
  })
  brokenList.forEach((pluginName) => {
    installPackage(pluginName, null, npmConfig)
  })
}

export const safePhysicallyRemove = async (packagePath: string): Promise<void> => {
  let packageStat
  try {
    packageStat = await lstat(packagePath)
  } catch (_) {
    return
  }
  if (packageStat.isSymbolicLink()) {
    return await unlink(packagePath)
  }
  try {
    const gitStat = await lstat(join(packagePath, '.git'))
    if (gitStat.isDirectory()) {
      console.error(
        `${packagePath} appears to be a git repository. For the safety of your files in development, please use 'npm link' to install plugins from github.`,
      )
      return
    }
  } catch (_) {
    return await remove(packagePath)
  }
}

export const getNpmConfig = (prefix: string): NpmConfig => {
  const mirrorConf = config.get('packageManager.mirrorName')
  const enableBetaPluginCheck = config.get('packageManager.enableBetaPluginCheck')
  const mirrorName = Object.keys(MIRRORS).includes(mirrorConf ?? '')
    ? (mirrorConf ?? 'npm')
    : navigator.language === 'zh-CN'
      ? 'taobao'
      : 'npm'
  const registry = MIRRORS[mirrorName]?.server ?? ''
  return { registry, prefix, enableBetaPluginCheck }
}
