import { omit, get, set } from 'lodash'
import { remote } from 'electron'
import { join, basename } from 'path-extra'
import { createReadStream, readJson, accessSync, readJsonSync, realpathSync, lstat, unlink, rmdir, lstatSync } from 'fs-extra'
import React from 'react'
import FontAwesome from 'react-fontawesome'
import semver from 'semver'
import module from 'module'
import npm from 'npm'
import Promise, { promisify } from 'bluebird'
import glob from 'glob'
import crypto from 'crypto'
import { setAllowedPath } from 'lib/module-path'

import { extendReducer } from 'views/create-store'
const { ROOT, config, language, toast, MODULE_PATH, APPDATA_PATH } = window
const windowManager = remote.require('./lib/window')
const utils = remote.require('./lib/utils')
const __ = window.i18n.setting.__.bind(window.i18n.setting)

const allowedPath = [ ROOT, APPDATA_PATH ]
const pathAdded = new Map()

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

export function installPackage(packageName, version) {
  if (version) {
    packageName = `${packageName}@${version}`
  }
  // let flow = co.wrap(function* (_this) {
  //   yield npminstall({
  //     root: _this.npmConfig.prefix,
  //     pkgs: [
  //       { name: plugin.packageName, version: plugin.latestVersion},
  //     ],
  //     registry: _this.npmConfig.registry,
  //     debug: true
  //   })
  //   return yield Promise.resolve()
  // })
  // await flow(this)
  return promisify(npm.commands.install)([packageName])
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
    window.i18n[namespace] = new (require('i18n-2'))({
      locales: ['ko-KR', 'en-US', 'ja-JP', 'zh-CN', 'zh-TW'],
      defaultLocale: 'en-US',
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
  return plugin
}

export function readPlugin(pluginPath) {
  let pluginData, packageData, plugin
  try {
    pluginData = readJsonSync(join(ROOT, 'assets', 'data', 'plugin.json'))
  } catch (error) {
    pluginData = {}
    utils.error(error)
  }
  try {
    packageData = readJsonSync(join(pluginPath, 'package.json'))
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
  const icon = plugin.icon.split('/')[1] || plugin.icon || 'th-large'
  plugin.displayName = (
    <span>
      <FontAwesome key={0} name={icon} />
      {' ' + plugin.name}
    </span>
  )
  plugin.timestamp = Date.now()
  return plugin
}

export function enablePlugin(plugin, reread=true) {
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
      ...require(plugin.pluginPath),
      ...reread ? readPlugin(plugin.pluginPath) : {},
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
  plugin = postEnableProcess(plugin)
  return plugin
}

export function disablePlugin(plugin) {
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
        set(windowOptions, 'webPreferences.preload', join(ROOT, 'assets', 'js', 'plugin-preload.js'))
      }
    } else {
      windowOptions = {
        x: config.get('poi.window.x', 0),
        y: config.get('poi.window.y', 0),
        width: 800,
        height: 600,
        webPreferences: {
          preload: join(ROOT, 'assets', 'js', 'plugin-preload.js'),
          webSecurity: false,
          plugins: true,
          experimentalFeatures: true,
          backgroundThrottling: false,
          offscreen: true,
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

export function notifyFailed(state) {
  const plugins = state.filter((plugin) => (plugin.isBroken))
  const unreadList = []
  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i]
    unreadList.push(plugin.name)
  }
  if (unreadList.length > 0) {
    const content = `${unreadList.join(' / ')} ${__('failed to load. Maybe there are some compatibility problems.')}`
    toast(content, {
      type: 'error',
      title: __('Plugin error'),
    })
  }
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
    return await promisify(rmdir)(packagePath)
  }
}
