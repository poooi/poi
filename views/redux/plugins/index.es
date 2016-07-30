import glob from 'glob'
import module from 'module'
import { sortBy } from 'lodash'
import { join } from 'path-extra'

import { getPluginIndexByPackageName, readPlugin, enablePlugin, disablePlugin, loadPlugin, unloadPlugin, notifyFailed, updateI18n } from './utils'

export function reducer (state=[], {type, value, option}) {
  const {reduxSet} = window
  switch (type) {
  case '@@Plugin/initaialize': {
    const pluginPaths = glob.sync(join(value, 'node_modules', 'poi-plugin-*'))
    let plugins = pluginPaths.map(readPlugin)
    for (const i in plugins) {
      const plugin = plugins[i]
      if (plugin.enabled) {
        loadPlugin(plugin)
      }
    }
    plugins = sortBy(plugins, 'priority')
    notifyFailed(plugins)
    return plugins
  }
  case '@@Plugin/replace': {
    state = [...state]
    const i = getPluginIndexByPackageName(state, value.packageName)
    state = reduxSet(state, [i], value)
    state = sortBy(state, 'priority')
    return state
  }
  case '@@Plugin/changeStatus': {
    state = [...state]
    const i = getPluginIndexByPackageName(state, value.packageName)
    for (const opt of option) {
      const {path, status} = opt
      state = reduxSet(state, [i].concat(path.split('.')), status)
    }
    return state
  }
  case '@@Plugin/enable': {
    state = [...state]
    const i = getPluginIndexByPackageName(state, value.packageName)
    let plugin = state[i]
    plugin = enablePlugin(plugin)
    state = reduxSet(state, [i], plugin)
    return state
  }
  case '@@Plugin/disable': {
    state = [...state]
    const i = getPluginIndexByPackageName(state, value.packageName)
    let plugin = state[i]
    plugin = disablePlugin(plugin)
    state = reduxSet(state, [i], plugin)
    return state
  }
  case '@@Plugin/load': {
    state = [...state]
    const i = getPluginIndexByPackageName(state, value.packageName)
    let plugin = state[i]
    plugin = loadPlugin(plugin)
    state = reduxSet(state, [i], plugin)
    return state
  }
  case '@@Plugin/unload': {
    state = [...state]
    const i = getPluginIndexByPackageName(state, value.packageName)
    let plugin = state[i]
    plugin = unloadPlugin(plugin)
    state = reduxSet(state, [i], plugin)
    return state
  }
  case '@@Plugin/remove': {
    state = [...state]
    const i = getPluginIndexByPackageName(state, value.packageName)
    let plugin = state[i]
    plugin = unloadPlugin(plugin)
    for (const path in module._cache) {
      if (path.includes(plugin.packageName)) {
        delete module._cache[path]
      }
    }
    for (const path in module._pathCache) {
      if (path.includes(plugin.packageName)) {
        delete module._pathCache[path]
      }
    }
    state.splice(i, 1)
    return state
  }
  case '@@Plugin/add': {
    state = [...state]
    let plugin = readPlugin(value)
    if (plugin.enabled) {
      plugin = loadPlugin(plugin)
    }
    state.push(plugin)
    state = sortBy(state, 'priority')
    return state
  }
  case '@@Plugin/reload': {
    state = [...state]
    const i = getPluginIndexByPackageName(state, value.packageName)
    const plugin = state[i]
    unloadPlugin(plugin)
    for (const path in module._cache) {
      if (path.includes(plugin.packageName)) {
        delete module._cache[path]
      }
    }
    for (const path in module._pathCache) {
      if (path.includes(plugin.packageName)) {
        delete module._pathCache[path]
      }
    }
    let newPlugin = readPlugin(plugin.pluginPath)
    if (newPlugin.enabled) {
      newPlugin = loadPlugin(newPlugin)
    }
    newPlugin = updateI18n(newPlugin)
    state = reduxSet(state, [i], newPlugin)
    state = sortBy(state, 'priority')
    return state
  }
  default:
    return state
  }
}
