import type { BrowserWindowConstructorOptions } from 'electron'
import type { BrowserWindow } from 'electron/main'
import type React from 'react'

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function getString(obj: Record<string, unknown>, key: string): string | undefined {
  const val = obj[key]
  return typeof val === 'string' ? val : undefined
}

export function getNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const val = obj[key]
  return typeof val === 'number' ? val : undefined
}

export function toStringRecord(obj: Record<string, unknown>): Record<string, string> {
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
  pluginWindow?: BrowserWindow | null
  handleClick?: () => void
  pluginDidLoad?: () => void
  pluginWillUnload?: () => void
  i18nDir?: string
  title?: string
  windowMode?: boolean
}

export interface BundlePluginI18n {
  // looked up by the current i18n language, which can be any locale string;
  // only the five locales below are guaranteed to exist
  [language: string]: string | undefined
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

export type PluginDataEntry = {
  link?: string
  version?: string
  [key: string]: unknown
}
