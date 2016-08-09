import { promisify } from 'bluebird'
import { readJson } from 'fs-extra'
import { get, set } from 'lodash'
import { join } from 'path-extra'
import glob from 'glob'

import { PromiseAction } from 'views/middlewares/promiseAction'
const { ROOT, MODULE_PATH } = window

const presetPluginListPath = join(ROOT, 'assets', 'data', 'plugin.json')

export function readPresetList() {
  return PromiseAction('@@Plugin/readPreset', () =>
    promisify(readJson)(presetPluginListPath)
  )
}

export function readInstalledList(value) {
  const pluginsGlobPath = join(value, 'node_modules', 'poi-plugin-*')
  return PromiseAction('@@Plugin/readInstalled', () =>
    promisify(glob)(pluginsGlobPath)
  )
}

export function readPackageData(pluginPath) {
  return PromiseAction('@@Plugin/readPackageData', () =>
    promisify(readJson)(join(pluginPath, 'packege.json')),
    pluginPath
  )
}

export function loadPlugin(plugin) {
  const canRequire = plugin.installed && !plugin.needRollback && !plugin.isBroken
  const {pluginPath} = plugin
  try {
    if (!canRequire || !pluginPath) {
      throw new Error('Plugin is not ready to be loaded.')
    }
    const result = require(pluginPath)
    try {
      if (typeof result.pluginDidLoad === 'function') {
        result.pluginDidLoad()
      }
    } catch (error) {
      console.error(error.stack)
    }
    return {
      type: '@@Plugin/load@then',
      result,
      args: plugin.packageName,
    }
  } catch (e) {
    return {
      type: '@@Plugin/load@catch',
      error: e,
      args: plugin.packageName,
    }
  }
}

export function unloadPlugin(packageName) {
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
  delete require.cache[require.resolve(plugin.pluginPath)]
  return {
    type: '@@Plugin/unload',
    packageName,
  }
}
