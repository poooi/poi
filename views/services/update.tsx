import type { ButtonData } from 'views/components/etc/modal'

import * as remote from '@electron/remote'
import { shell } from 'electron'
import fetch from 'node-fetch'
import React from 'react'
import Markdown from 'react-remarkable'
import semver from 'semver'
import { config } from 'views/env'
import i18next from 'views/env-parts/i18next'
import { toggleModal } from 'views/env-parts/modal'

const fetchHeaders: Record<string, string> = {
  'Cache-Control': 'max-age=0',
  'User-Agent': `poi v${window.POI_VERSION}`,
}
const defaultFetchOption = {
  method: 'GET' as const,
  cache: 'default' as RequestCache,
  headers: fetchHeaders,
}

const { updater } = process.platform !== 'linux' ? remote.require('./lib/updater') : {}
const LANG = ['zh-CN', 'zh-TW', 'en-US']
const doUpdate = async () => {
  if (process.platform == 'win32') {
    try {
      await updater.checkForUpdates()
      await updater.downloadUpdate()
    } catch (_) {
      window.toast(i18next.t('Please try again or download manually.'), {
        type: 'danger',
        title: i18next.t('Update failed'),
      })
    }
  }
}

if (process.platform === 'win32') {
  updater.on('update-available', () => {
    // eslint-disable-next-line no-console
    console.log('Update from poi.moe available')
  })

  updater.on('update-downloaded', () => {
    window.toast(i18next.t('Quit app and install updates'), {
      type: 'success',
      title: i18next.t('Update successful'),
    })
  })

  updater.on('update-not-available', () => {
    console.warn('Update from poi.moe not available')
  })

  updater.on('error', (_event: unknown, _error: unknown) => {
    window.toast(i18next.t('Please try again or download manually'), {
      type: 'danger',
      title: i18next.t('Update failed'),
    })
  })
}

const UPDATE_SERVER = 'update.poi.moe'

export const checkUpdate = async () => {
  const betaChannel = config.get('poi.update.beta', false)
  const versionInfo = await fetch(
    `https://${UPDATE_SERVER}/update/latest.json`,
    defaultFetchOption as Parameters<typeof fetch>[1],
  )
    .then((res) => res.json())
    .catch((e: Error) => {
      console.warn('Check update error.', e.stack)
      return {}
    })
  if (versionInfo.version) {
    const version =
      betaChannel && semver.gt(versionInfo.betaVersion, versionInfo.version)
        ? versionInfo.betaVersion || 'v0.0.0'
        : versionInfo.version
    const channel = version.includes('beta') ? '-beta' : ''
    // eslint-disable-next-line no-console
    console.log(`Remote version: ${version}. Current version: ${window.POI_VERSION}`)
    const knownVersion = (config.get('poi.update.knownVersion', window.POI_VERSION) ??
      window.POI_VERSION) as string

    if (semver.lt(window.POI_VERSION, version) && semver.lt(knownVersion, version)) {
      const currentLang = LANG.includes(language) ? language : 'en-US'
      const log = await fetch(
        `https://${UPDATE_SERVER}/update/${currentLang}${channel}.md`,
        defaultFetchOption as Parameters<typeof fetch>[1],
      )
        .then((res) => res.text())
        .catch(() => {
          console.warn('fetch update log error')
          return ''
        })
      toggleUpdate(version, log)
    }
  }
}

const toggleUpdate = (version: string, log: string) => {
  const title = `${String(i18next.t('Update'))} poi-${version}`
  const content = <Markdown source={log} />
  const footer: ButtonData[] = [
    {
      name: String(i18next.t('I know')),
      func: () => config.set('poi.update.knownVersion', version),
      style: 'success',
    },
    {
      name: `${String(i18next.t('Manually download'))}`,
      func: () => shell.openExternal('https://poi.moe'),
      style: 'primary',
    },
  ]
  if (process.platform === 'win32') {
    footer.push({
      name: `${String(i18next.t('Auto update'))}`,
      func: doUpdate,
      style: 'primary',
    })
  }
  toggleModal(title, content, footer)
}

if (config.get('poi.update.enable', true)) {
  setTimeout(checkUpdate, 5000)
}
