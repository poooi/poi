import { omit, get, set, each, isArray } from 'lodash'
import { remote } from 'electron'
import { join, basename } from 'path-extra'
import { createReadStream, readJson, accessSync, realpathSync, lstat, unlink, remove, lstatSync } from 'fs-extra'
import React from 'react'
import FontAwesome from '@skagami/react-fontawesome'
import semver from 'semver'
import module from 'module'
import { promisify } from 'bluebird'
import glob from 'glob'
import crypto from 'crypto'
import { setAllowedPath } from 'lib/module-path'
import child_process from 'child_process'
import path from 'path'
import i18next from 'views/env-parts/i18next'
import { readI18nResources, normalizeURL } from 'views/utils/tools'

import { extendReducer } from 'views/create-store'
const { ROOT, config, language, toast, MODULE_PATH, APPDATA_PATH } = window
const windowManager = remote.require('./lib/window')
const utils = remote.require('./lib/utils')

const allowedPath = [ ROOT, APPDATA_PATH ]
const pathAdded = new Map()
const NPM_EXEC_PATH = path.join(ROOT, 'node_modules', 'npm', 'bin', 'npm-cli.js')

require('module').globalPaths.push(MODULE_PATH)

// This reducer clears the substore no matter what is given.
const clearReducer = undefined

function calculateShasum(path) {
  return new Promise((resolve, reject) => {
    try {
      const hash = crypto.createHash('sha1')
      const stream = createReadStream(path)

      stream.on('data', (data) => {
        hash.update(data, 'utf8')
      })

      stream.on('end', function () {
        resolve(hash.digest('hex'))
      })

      stream.on('error', function (e) {
        reject(e)
      })
    } catch (e) {
      reject(e)
    }
  })
}

export const findInstalledTarball = async (pluginRoot, tarballPath) => {
  const filename = basename(tarballPath)
  const pluginPaths = await promisify(glob)(join(pluginRoot, 'poi-plugin-*'))
  const packageDatas = await Promise.all(pluginPaths.map((pluginPath) =>
    promisify(readJson)(join(pluginPath, 'package.json'))))
  // packageJson._required.raw should contain full path upon installation
  const nameMatchDatas = packageDatas.filter((packageData) =>
    get(packageData, '_requested.raw', '').endsWith(filename))
  if (nameMatchDatas.length === 1) {
    return nameMatchDatas[0].name
  }
  if (nameMatchDatas.length === 0) {
    throw new Error(`Error: Can' find a package matching ${tarballPath}.`)
  }
  // In EXTREMELY tricky cases 2 differently named packages might have been
  // installed from the same path. Unbelievable huh? We can still match checksum.
  // packageJson._shasum should contain shasum.
  const shasum = await calculateShasum(tarballPath)
  const shasumMatchDatas = nameMatchDatas.filter((data) => data._shasum === shasum)
  if (!shasumMatchDatas[0])
    throw new Error(`Error: Can' find a package installed from ${tarballPath} matching shasum ${shasum}.`)
  // I believe it won't collide.
  return shasumMatchDatas[0].name
}

const runScriptAsync = (scriptPath, args, options) =>
  new Promise ((resolve) => {
    const proc = child_process.fork(scriptPath, args, options)
    proc.on('exit', () => resolve())
  })

export async function installPackage (packageName, version, npmConfig) {
  if (!packageName) {
    return
  }
  if (version) {
    packageName = `${packageName}@${version}`
  }
  let args = ['install', '--registry', npmConfig.registry]
  if (npmConfig.http_proxy) {
    args = [...args, '--proxy', npmConfig.http_proxy]
  }
  args = [...args, '--no-progress', '--global-style', '--no-package-lock', packageName]
  await runScriptAsync(NPM_EXEC_PATH, args, {
    cwd: npmConfig.prefix,
  })
}

export async function removePackage (target, npmConfig) {
  const args = ['uninstall', '--no-progress', '--no-save', target]
  await runScriptAsync(NPM_EXEC_PATH, args, {
    cwd: npmConfig.prefix,
  })
  await repairDep([], npmConfig)
}


export function updateI18n(plugin) {
  let i18nFile = null
  if (plugin.i18nDir != null) {
    i18nFile = join(plugin.pluginPath, plugin.i18nDir)
  } else {
    try {
      accessSync(join(plugin.pluginPath, 'i18n'))
      i18nFile = join(plugin.pluginPath, 'i18n')
    } catch (error) {
      try {
        accessSync(join(plugin.pluginPath, 'assets', 'i18n'))
        i18nFile = join(plugin.pluginPath, 'assets', 'i18n')
      } catch (error) {
        console.warn(`${plugin.packageName}: No translate file found.`)
      }
    }
  }
  if (i18nFile != null) {
    const namespace = plugin.id
    each(window.LOCALES, (language) => {
      i18next.addGlobalI18n(namespace)
      i18next.addResourceBundleDebounce(
        language,
        namespace,
        readI18nResources(join(i18nFile, `${language}.json`,)),
        true,
        true,
      )
    })
    plugin.name = i18next.t(`${namespace}:${plugin.name}`)
    plugin.description = i18next.t(`${namespace}:${plugin.description}`)
  }
  return plugin
}

export async function readPlugin(pluginPath) {
  let pluginData, packageData, plugin
  try {
    pluginData = await readJson(join(ROOT, 'assets', 'data', 'plugin.json'))
  } catch (error) {
    pluginData = {}
    utils.error(error)
  }
  try {
    packageData = await readJson(join(pluginPath, 'package.json'))
  } catch (error) {
    packageData = {}
    utils.error(error)
  }
  plugin = packageData.poiPlugin || {}
  // omit poiPlugin to avoid circular object
  plugin.packageData = omit(packageData, 'poiPlugin')
  plugin.packageName = plugin.packageData.name || basename(pluginPath)
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
  // Resolve symlink.
  plugin.pluginPath = realpathSync(pluginPath)
  // check if it is symbolic linked plugin
  // since function will be called when checking update, the second call
  // will check with real path, make sure to attribute it only when symbolic link
  const pluginStat = lstatSync(pluginPath)
  if (pluginStat.isSymbolicLink()) {
    plugin.linkedPlugin = true
  }
  if (plugin.icon == null) {
    plugin.icon = 'fa/th-large'
  }
  plugin.version = (plugin.packageData || {}).version || '0.0.0'
  plugin.latestVersion = plugin.version
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
  plugin.isUpdating = false
  plugin.needRollback = false
  if (plugin.apiVer) {
    let nearestCompVer = 'v214.748.3647'
    for (const mainVersion in plugin.apiVer) {
      if (semver.lte(window.POI_VERSION, mainVersion) && semver.lt(mainVersion, nearestCompVer) && semver.gt(plugin.version, plugin.apiVer[mainVersion])) {
        plugin.needRollback = true
        nearestCompVer = mainVersion
        plugin.latestVersion = plugin.apiVer[mainVersion]
      }
    }
  }
  plugin.isOutdated = plugin.needRollback
  plugin = updateI18n(plugin)
  const icon = isArray(plugin.icon)
    ? plugin.icon
    : plugin.icon.split('/')[1] || plugin.icon|| 'th-large'
  plugin.displayName = (
    <>
      {
        isArray(icon)
          ? <FontAwesome icon={icon} />
          : <FontAwesome name={icon} />
      } {plugin.name}
    </>
  )
  plugin.timestamp = Date.now()
  return plugin
}

export async function enablePlugin(plugin, reread=true) {
  if (!pathAdded.get(plugin.packageName) && !plugin.windowURL) {
    allowedPath.push(plugin.pluginPath)
    setAllowedPath(allowedPath)
    pathAdded.set(plugin.packageName, true)
  }
  if (plugin.needRollback)
    return plugin
  let pluginMain
  try {
    pluginMain = {
      ...await import(plugin.pluginPath),
      ...reread ? await readPlugin(plugin.pluginPath) : {},
    }
    pluginMain.enabled = true
    pluginMain.isRead = true
    if (!plugin.id && pluginMain.name) {
      pluginMain.id = pluginMain.name
    }
  } catch (error) {
    console.error(error.stack)
    pluginMain = {
      enabled: false,
      isBroken: true,
    }
  }
  plugin = {
    ...plugin,
    ...pluginMain,
  }
  if (plugin.windowURL) {
    plugin.realClose = !config.get(`poi.backgroundProcess.${plugin.id}`, !plugin.realClose)
  }
  plugin = postEnableProcess(plugin)
  return plugin
}

export async function disablePlugin(plugin) {
  plugin.enabled = false
  try {
    plugin = unloadPlugin(plugin)
  } catch (error) {
    console.error(error.stack)
  }
  return plugin
}

const postEnableProcess = (plugin) => {
  if (plugin.reducer) {
    try {
      extendReducer(plugin.packageName, plugin.reducer)
    } catch (e) {
      console.error(e.stack)
    }
  }
  let windowOptions
  if (plugin.windowURL) {
    if (plugin.windowOptions) {
      windowOptions = plugin.windowOptions
      if (!get(windowOptions, 'webPreferences.preload')) {
        set(windowOptions, 'webPreferences.affinity', 'poi-plugin')
        set(windowOptions, 'webPreferences.preload', join(ROOT, 'assets', 'js', 'plugin-preload.js'))
      }
      if (!get(windowOptions, 'webPreferences.nodeIntegrationInWorker')) {
        set(windowOptions, 'webPreferences.nodeIntegrationInWorker', true)
      }
    } else {
      windowOptions = {
        x: config.get('poi.window.x', 0),
        y: config.get('poi.window.y', 0),
        width: 800,
        height: 600,
        webPreferences: {
          preload: join(ROOT, 'assets', 'js', 'plugin-preload.js'),
          plugins: true,
          nodeIntegrationInWorker: true,
          affinity: 'poi-plugin',
        },
      }
    }
    Object.assign(windowOptions, {
      realClose: plugin.realClose,
      backgroundColor: process.platform === 'darwin' ? '#00000000' : '#E62A2A2A',
      // frame: !config.get('poi.useCustomTitleBar', process.platform === 'win32' || process.platform === 'linux'),
    })
    if (['darwin'].includes(process.platform) && config.get('poi.vibrant', 0) === 1) {
      Object.assign(windowOptions, {
        vibrancy: 'ultra-dark',
      })
    }
    const windowURL = normalizeURL(plugin.windowURL)
    if (plugin.multiWindow) {
      plugin.handleClick = function() {
        const pluginWindow = windowManager.createWindow(windowOptions)
        pluginWindow.setMenu(require('views/components/etc/menu').appMenu)
        pluginWindow.setAutoHideMenuBar(true)
        pluginWindow.setMenuBarVisibility(false)
        pluginWindow.loadURL(windowURL)
        pluginWindow.show()
      }
    } else if (plugin.realClose) {
      plugin.pluginWindow = null
      plugin.handleClick = function() {
        if (plugin.pluginWindow == null) {
          plugin.pluginWindow = windowManager.createWindow(windowOptions)
          plugin.pluginWindow.setMenu(require('views/components/etc/menu').appMenu)
          plugin.pluginWindow.setAutoHideMenuBar(true)
          plugin.pluginWindow.setMenuBarVisibility(false)
          plugin.pluginWindow.on('close', function() {
            plugin.pluginWindow = null
          })
          plugin.pluginWindow.loadURL(windowURL)
          plugin.pluginWindow.show()
        } else {
          plugin.pluginWindow.show()
        }
      }
    } else {
      plugin.pluginWindow = windowManager.createWindow(windowOptions)
      plugin.pluginWindow.setMenu(require('views/components/etc/menu').appMenu)
      plugin.pluginWindow.setAutoHideMenuBar(true)
      plugin.pluginWindow.setMenuBarVisibility(false)
      plugin.pluginWindow.loadURL(windowURL)
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
  return plugin
}

function clearPluginCache(packagePath) {
  for (const path in module._cache) {
    if (path.includes(basename(packagePath))) {
      delete module._cache[path]
    }
  }
  for (const path in module._pathCache) {
    if (path.includes(basename(packagePath))) {
      delete module._pathCache[path]
    }
  }
}

export function unloadPlugin(plugin) {
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
  // Here we clear caches of files under pluginPath with symlinks resolved.
  // Problems still exist where deeper symlinks are not resolved.
  // But this solved the major problem of using `npm link` .
  clearPluginCache(plugin.pluginPath)
  extendReducer(plugin.packageName, clearReducer)
  return plugin
}

export function notifyFailed(state, npmConfig) {
  const plugins = state.filter((plugin) => (plugin.isBroken))
  const unreadList = []
  const reinstallList = []
  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i]
    unreadList.push(plugin.name)
    if (!plugin.linkedPlugin)
      reinstallList.push(plugin.packageName)
  }
  if (unreadList.length > 0) {
    const content = `${unreadList.join(' / ')} ${i18next.t('setting:PluginLoadFailed')}`
    toast(content, {
      type: 'error',
      title: i18next.t('setting:Plugin error'),
    })
  }
  repairDep(reinstallList, npmConfig)
}

export async function repairDep(brokenList, npmConfig) {
  const depList = (await new Promise(res => {
    glob(path.join(npmConfig.prefix, 'node_modules', '*'), (err, matches) => res(matches))
  })).filter(p => !p.includes('poi-plugin'))
  depList.forEach(p => {
    try {
      require(p)
    } catch (e) {
      safePhysicallyRemove(p, npmConfig)
    }
  })
  brokenList.forEach(pluginName => {
    installPackage(pluginName, null, npmConfig)
  })
}

// Unlink a path if it's a symlink.
// Do nothing (but logging error) if it's a git repo.
// Remove the directory otherwise.
export const safePhysicallyRemove = async (packagePath) => {
  let packageStat
  try {
    packageStat = await promisify(lstat)(packagePath)
  } catch (e) {
    // No longer exists
    return
  }
  // If it's a symlink, unlink it
  if (packageStat.isSymbolicLink()) {
    return await promisify(unlink)(packagePath)
  }
  // If it's a git repo, log error and do nothing
  try {
    const gitStat = await promisify(lstat)(join(packagePath, '.git'))
    if (gitStat.isDirectory()) {
      console.error(`${packagePath} appears to be a git repository. For the safety of your files in development, please use 'npm link' to install plugins from github.`)
      return
    }
  } catch (e) {
    return await remove(packagePath)
  }
}
