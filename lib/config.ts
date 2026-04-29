import type { DeepKeyOf, DeepKeyOfArray, DeepValueOf, DeepValueOfArray } from 'shims/utils'

import CSON from 'cson'
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
export type ConfigStringPath = DeepKeyOf<Config> | ''
export type ConfigArrayPath = DeepKeyOfArray<Config>
export type ConfigPath = ConfigStringPath | ConfigArrayPath
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

export interface ConfigEventMap {
  'config.set': <P extends ConfigStringPath>(path: P, value: ConfigValue<P>) => void
  'config.delete': <P extends ConfigStringPath>(path: P) => void
}

export type ConfigListener<E extends keyof ConfigEventMap> = ConfigEventMap[E]

type StoredListener = ConfigListener<keyof ConfigEventMap>

class PoiConfig {
  configData: Config
  defaultConfigData: Config
  private listeners: Partial<Record<keyof ConfigEventMap, StoredListener[]>> = {}

  constructor() {
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

  addListener = <E extends keyof ConfigEventMap>(event: E, listener: ConfigListener<E>): void => {
    ;(this.listeners[event] ??= [] as StoredListener[]).push(listener)
  }

  on = this.addListener

  private emit = <E extends keyof ConfigEventMap>(
    event: E,
    ...args: Parameters<ConfigEventMap[E]>
  ) => {
    this.listeners[event]?.forEach((listener) => {
      // @ts-expect-error the parameter is guaranteed to match the listener type for this event
      listener(...args)
    })
  }

  removeListener = <E extends keyof ConfigEventMap>(
    event: E,
    listener: ConfigListener<E>,
  ): void => {
    const arr = this.listeners[event]
    if (!arr) return
    const idx = arr.indexOf(listener)
    if (idx !== -1) arr.splice(idx, 1)
  }

  off = this.removeListener

  /**
   * get a config value at give path
   * @param {ConfigPath} path the given config location
   * @param value value to fallback if queried config is undefined
   */
  get = <
    const Path extends ConfigPath,
    const Value extends ConfigValue<Path> | undefined = undefined,
  >(
    path: Path,
    value?: Value,
  ): Value extends undefined ? ConfigValue<Path> : NonNullable<ConfigValue<Path>> => {
    if (path === '') {
      // @ts-expect-error the empty path is guaranteed to return the full config object, which matches the expected type
      return this.configData
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
  getDefault = <
    const Path extends ConfigPath,
    const Value extends ConfigValue<Path> | undefined = undefined,
  >(
    path: Path,
    value?: Value,
  ): Value extends undefined ? ConfigValue<Path> : NonNullable<ConfigValue<Path>> => {
    if (path === '') {
      // @ts-expect-error the empty path is guaranteed to return the full config object, which matches the expected type
      return this.defaultConfigData
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
    const pathToEmit = Array.isArray(path) ? path.join('.') : path
    const valueToSet = value ?? this.getDefault(path)
    set(this.configData, path, valueToSet)
    // @ts-expect-error the value is guaranteed to match the listener type for this event
    this.emit('config.set', pathToEmit, valueToSet)
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
   * remove a config at given path
   * @param {ConfigPath} path path to remove
   */
  delete = (path: ConfigPath) => {
    if (typeof this.get(path) !== 'undefined') {
      unset(this.configData, path)
      const pathToEmit = Array.isArray(path) ? path.join('.') : path
      // @ts-expect-error the parameter is guaranteed to match the listener type for this event
      this.emit('config.delete', pathToEmit)
      this.save()
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
}

const config = new PoiConfig()

export type ConfigInstance = typeof config

export default config
