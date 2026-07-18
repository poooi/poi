import type * as Utils from 'lib/utils'
import type { FC } from 'react'

import * as remote from '@electron/remote'
import FontAwesome from '@skagami/react-fontawesome'
import { readJson, realpathSync, lstatSync } from 'fs-extra'
import { omit } from 'lodash'
import { join, basename } from 'path'
import React from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-remarkable'
import semver from 'semver'
import { config, ROOT } from 'views/env'

import type { BundlePluginMeta, Plugin, PluginDataEntry } from './types'

import { updateI18n } from './plugin-i18n'
import { isRecord, getString, getNumber, toStringRecord } from './types'

const utils: typeof Utils = remote.require('./lib/utils')

const BundlePluginDisplayName: FC<BundlePluginMeta> = (meta) => {
  const { i18n } = useTranslation('setting')
  return (
    <>
      <FontAwesome name={meta.icon.split('/')[1] || meta.icon} />{' '}
      {meta.name[i18n.language] ?? meta.name['en-US']}
    </>
  )
}

const BundlePluginDescription: FC<BundlePluginMeta> = (meta) => {
  const { i18n } = useTranslation('setting')
  return (
    <ReactMarkdown
      options={{ linkTarget: '_blank' }}
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
