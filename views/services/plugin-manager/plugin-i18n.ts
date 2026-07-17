import type React from 'react'

import { accessSync } from 'fs-extra'
import { each } from 'lodash'
import { join } from 'path'
import i18next, { addGlobalI18n, addResourceBundleDebounce } from 'views/env-parts/i18next'
import { readI18nResources } from 'views/utils/tools'

import type { Plugin } from './types'

export function updateI18n(plugin: Plugin): Plugin {
  let i18nFile: string | null = null
  if (plugin.i18nDir != null) {
    i18nFile = join(plugin.pluginPath, plugin.i18nDir)
  } else {
    try {
      accessSync(join(plugin.pluginPath, 'i18n'))
      i18nFile = join(plugin.pluginPath, 'i18n')
    } catch (_) {
      try {
        accessSync(join(plugin.pluginPath, 'assets', 'i18n'))
        i18nFile = join(plugin.pluginPath, 'assets', 'i18n')
      } catch (_error) {
        console.warn(`${plugin.packageName}: No translate file found.`)
      }
    }
  }
  if (i18nFile != null) {
    const namespace = plugin.id
    const i18nFilePath = i18nFile
    each(
      window.LOCALES.map((lng) => lng.locale),
      (lng) => {
        addGlobalI18n(namespace)
        addResourceBundleDebounce(
          lng,
          namespace,
          readI18nResources(join(i18nFilePath, `${lng}.json`)),
          true,
          true,
        )
      },
    )
    return {
      ...plugin,
      name: i18next.t(`${namespace}:${plugin.name}`),
      description:
        typeof plugin.description === 'string'
          ? (i18next.t(`${namespace}:${plugin.description}`) satisfies string)
          : (plugin.description satisfies React.ReactNode),
    }
  }
  return plugin
}
