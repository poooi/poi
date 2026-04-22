/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DeepKeyOf } from 'shims/utils'

import CSON from 'cson'
import EventEmitter from 'events'
import fs from 'fs-extra'
import { set, get, isEqual, keys } from 'lodash'
import path from 'path'

import dbg from './debug'
import defaultConfig, { type DefaultConfig } from './default-config'
import { mergeConfig, warn } from './utils'

const { EXROOT } = global
const configPath = path.join(EXROOT, 'config.cson')

const DEFAULT_CONFIG_PATH_REGEXP = new RegExp(`^[${keys(defaultConfig).join('|')}]`)

export type Config = Partial<DefaultConfig>
export type ConfigPath = DeepKeyOf<DefaultConfig>

class PoiConfig extends EventEmitter {
  configData: Config
  defaultConfigData: DefaultConfig

  constructor() {
    super()
    this.configData = {} as Config
    try {
      fs.accessSync(configPath, fs.constants.R_OK | fs.constants.W_OK)
      this.configData = mergeConfig(defaultConfig, CSON.parseCSONFile(configPath)) as Config
      dbg.log(`Config loaded from: ${configPath}`)
    } catch (e) {
      dbg.log(e)
    }
    this.defaultConfigData = defaultConfig
  }

  /**
   * get a config value at give path
   * @param {ConfigPath | ConfigPath[]} path the given config location
   * @param value value to fallback if queried config is undefined
   */
  get = <
    Path extends ConfigPath | ConfigPath[],
    ValueType extends Path extends ConfigPath ? DeepValueOf<DefaultConfig, Path> : never,
  >(
    path: Path,
    value?: ValueType,
  ) => {
    if (path === '') {
      return this.configData
    }
    if (dbg.isEnabled()) {
      const stringPath = Array.isArray(path) ? path.join('.') : path
      if (
        DEFAULT_CONFIG_PATH_REGEXP.test(stringPath) &&
        value !== undefined &&
        !isEqual(get(this.defaultConfigData, path), value)
      ) {
        warn('There might be a mssing config default, check', stringPath, value)
      }
    }
    return get(this.configData, path, this.getDefault(path, value))
  }

  /**
   * get default config value at give path
   * @param {ConfigPath | ConfigPath[]} path the given config location
   */
  getDefault = <
    Path extends ConfigPath | ConfigPath[],
    ValueType extends Path extends ConfigPath ? DeepValueOf<DefaultConfig, Path> : never,
  >(
    path: Path,
    value?: ValueType,
  ) => {
    if (path === '') {
      return this.defaultConfigData
    }
    return get(this.defaultConfigData, path, value)
  }

  /**
   * set a config value at give path
   * @param {ConfigPath | ConfigPath[]} path the given config location
   * @param value value to overwrite, if the path belongs to poi's default config, will reset to default value
   */
  set = <
    Path extends ConfigPath | ConfigPath[],
    ValueType extends Path extends ConfigPath ? DeepValueOf<DefaultConfig, Path> : never,
  >(
    path: Path,
    value?: ValueType,
  ) => {
    if (get(this.configData, path) === value) {
      return
    }
    if (value === undefined && this.getDefault(path) !== undefined) {
      value = this.getDefault(path)
    }
    set(this.configData, path, value)
    path = Array.isArray(path) ? path.join('.') : path
    this.emit('config.set', path, value)
    this.save()
  }

  /**
   * set a config value only when it is not set (addition only)
   * @param {ConfigPath | ConfigPath[]} path the given config location
   * @param value value to overwrite, leaving undefined will remove the config
   */
  setDefault = <
    Path extends ConfigPath | ConfigPath[],
    ValueType extends Path extends ConfigPath ? DeepValueOf<DefaultConfig, Path> : never,
  >(
    path: Path,
    value?: ValueType,
  ) => {
    if (this.get(path) === undefined) {
      this.set(path, value)
    }
  }

  /**
   * save current config to file
   */
  save = () => {
    try {
      fs.writeFileSync(configPath, CSON.stringify(this.configData, undefined, 2))
    } catch (e) {
      console.warn(e)
    }
  }

  /**
   * remove a config at given path
   * @param {ConfigPath | ConfigPath[]} path path to remove
   */
  delete = <Path extends ConfigPath | ConfigPath[]>(path: Path) => {
    if (typeof this.get(path) !== 'undefined') {
      let p = this.configData
      const subpath = Array.isArray(path) ? path : path.split('.')
      for (const sub of subpath.slice(0, subpath.length - 1)) {
        p = p[sub]
      }
      delete p[subpath[subpath.length - 1]]
    }
  }
}

const config = new PoiConfig()
config.setMaxListeners(100)

export type ConfigInstance = typeof config

export default config
