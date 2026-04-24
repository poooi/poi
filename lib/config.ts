import type { DeepKeyOf, DeepKeyOfArray, DeepValueOf, DeepValueOfArray } from 'shims/utils'

import CSON from 'cson'
import EventEmitter from 'events'
import fs from 'fs-extra'
import { set, get, isEqual, keys, unset } from 'lodash'
import path from 'path'

import dbg from './debug'
import defaultConfig, { type Config } from './default-config'
import { mergeConfig, warn } from './utils'

const { EXROOT } = global
const configPath = path.join(EXROOT, 'config.cson')

const DEFAULT_CONFIG_PATH_REGEXP = new RegExp(`^[${keys(defaultConfig).join('|')}]`)

export type { Config } from './default-config'
export type ConfigPath = DeepKeyOf<Config> | DeepKeyOfArray<Config> | ''
export type ConfigValue<Path extends ConfigPath> =
  // When Path is the full ConfigPath union (TypeScript error-recovery substitution),
  // return never so callers see `never` instead of the union of all config values.
  [ConfigPath] extends [Path]
    ? never
    : Path extends ''
      ? Config
      : Path extends DeepKeyOf<Config>
        ? DeepValueOf<Config, Path>
        : Path extends DeepKeyOfArray<Config>
          ? DeepValueOfArray<Config, Path>
          : never

class PoiConfig extends EventEmitter {
  configData: Config
  defaultConfigData: Config

  constructor() {
    super()
    this.configData = defaultConfig
    try {
      fs.accessSync(configPath, fs.constants.R_OK | fs.constants.W_OK)
      this.configData = mergeConfig(defaultConfig, CSON.parseCSONFile(configPath) satisfies Config)
      dbg.log(`Config loaded from: ${configPath}`)
    } catch (e) {
      dbg.log(e)
    }
    this.defaultConfigData = defaultConfig
  }

  /**
   * get a config value at give path
   * @param {ConfigPath} path the given config location
   * @param value value to fallback if queried config is undefined
   */
  get = <const Path extends ConfigPath>(
    path: Path,
    value?: ConfigValue<Path>,
  ): ConfigValue<Path> => {
    if (path === '') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      return this.configData as ConfigValue<Path>
    }
    if (dbg.isEnabled()) {
      const stringPath = Array.isArray(path) ? path.join('.') : `${path}`
      if (
        DEFAULT_CONFIG_PATH_REGEXP.test(stringPath) &&
        value !== undefined &&
        !isEqual(get(this.defaultConfigData, path), value)
      ) {
        warn('There might be a missing config default, check', stringPath, value)
      }
    }
    return get(this.configData, path, this.getDefault(path, value))
  }

  /**
   * get default config value at give path
   * @param {ConfigPath} path the given config location
   */
  getDefault = <const Path extends ConfigPath>(
    path: Path,
    value?: ConfigValue<Path>,
  ): ConfigValue<Path> => {
    if (path === '') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      return this.defaultConfigData as ConfigValue<Path>
    }
    return get(this.defaultConfigData, path, value)
  }

  /**
   * set a config value at give path
   * @param {ConfigPath} path the given config location
   * @param value value to overwrite, if the path belongs to poi's default config, will reset to default value
   */
  set = <const Path extends ConfigPath>(path: Path, value?: ConfigValue<Path>): void => {
    if (get(this.configData, path) === value) {
      return
    }
    if (value === undefined && this.getDefault(path) !== undefined) {
      value = this.getDefault(path)
    }
    set(this.configData, path, value)
    const pathToSet = Array.isArray(path) ? path.join('.') : path
    this.emit('config.set', pathToSet, value)
    this.save()
  }

  /**
   * set a config value only when it is not set (addition only)
   * @param {ConfigPath} path the given config location
   * @param value value to overwrite, leaving undefined will remove the config
   */
  setDefault = <const Path extends ConfigPath>(path: Path, value?: ConfigValue<Path>): void => {
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
   * @param {ConfigPath} path path to remove
   */
  delete = (path: ConfigPath) => {
    if (typeof this.get(path) !== 'undefined') {
      unset(this.configData, path)
    }
  }
}

const config = new PoiConfig()
config.setMaxListeners(100)

export type ConfigInstance = typeof config

export default config
