import type { PoiWindowOptions, default as WindowManager } from 'lib/window'

import * as remote from '@electron/remote'
import { Module } from 'module'
import { join, sep } from 'path'
import { pathToFileURL } from 'url'
import { extendReducer } from 'views/create-store'
import { config, ROOT } from 'views/env'
import i18next from 'views/env-parts/i18next'
import { normalizeURL } from 'views/utils/tools'

import type { NpmConfig, Plugin } from './types'

import { readPlugin } from './read-plugin'
import { isRecord } from './types'

const windowManager: typeof WindowManager = remote.require('./lib/window')

const clearReducer = undefined

export async function enablePlugin(plugin: Plugin, reread = true): Promise<Plugin> {
  if (plugin.needRollback) return plugin
  let pluginMain: Partial<Plugin>
  try {
    const resolved = require.resolve(plugin.pluginPath)
    let imported: Partial<Plugin>
    try {
      if (
        resolved.endsWith('.ts') ||
        resolved.endsWith('.tsx') ||
        resolved.endsWith('.jsx') ||
        resolved.endsWith('.es')
      ) {
        // untranspiled files can't be required directly, use require()
        imported = await Promise.resolve(require(resolved))
      } else {
        // for transpiled files, use dynamic import to get better performance
        imported = await import(`${pathToFileURL(resolved).href}?t=${Date.now()}`)
      }
    } catch {
      // fallback
      imported = await Promise.resolve(require(resolved))
    }
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
    pluginMain = {
      enabled: false,
      isBroken: true,
      loadError: error instanceof Error ? error.message : String(error),
    }
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
        ? 'under-window'
        : undefined

    const windowOptions: PoiWindowOptions = {
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
        contextIsolation: false,
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
        const win = windowManager.createWindow(windowOptions)
        win.setMenu(require('views/components/etc/menu').appMenu)
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
          plugin.pluginWindow?.setMenu(require('views/components/etc/menu').appMenu)
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
      plugin.pluginWindow?.setMenu(require('views/components/etc/menu').appMenu)
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
  // Stay inside the plugin's own directory: matching only the basename would
  // also evict another plugin with the same name under a different @scope.
  const boundary = packagePath + sep
  const belongsToPlugin = (path: string): boolean =>
    path === packagePath || path.startsWith(boundary) || path.includes(boundary)
  for (const p in require.cache) {
    if (belongsToPlugin(p)) {
      delete require.cache[p]
    }
  }
  // _pathCache is a Node.js internal not typed in @types/node
  type ModuleWithPathCache = typeof Module & { _pathCache?: Record<string, string | string[]> }
  const pathCache = (Module as ModuleWithPathCache)._pathCache
  for (const p in pathCache) {
    if (belongsToPlugin(p)) {
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

export function notifyFailed(state: Plugin[], _npmConfig?: NpmConfig): void {
  const plugins = state.filter((plugin) => plugin.isBroken)
  const unreadList = plugins.map((plugin) => plugin.name)
  if (unreadList.length > 0) {
    const content = `${unreadList.join(' / ')} ${i18next.t('setting:PluginLoadFailed')}`
    window.toast(content, { type: 'error', title: i18next.t('setting:Plugin error') })
  }
}
