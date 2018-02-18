import React from 'react'
import { shell, remote } from 'electron'
import semver from 'semver'
import Markdown from 'react-remarkable'
import fetch from 'node-fetch'
import i18next from 'views/env-parts/i18next'

const {POI_VERSION, toggleModal, config, language} = window

const fetchHeader = new Headers()
fetchHeader.set("Cache-Control", "max-age=0")
fetchHeader.set('User-Agent', `poi v${POI_VERSION}`)
const defaultFetchOption = {
  method: "GET",
  cache: "default",
  headers: fetchHeader,
}

const { updater } = process.platform !== 'linux' ? remote.require('./lib/updater') : {}
const LANG = ['zh-CN', 'zh-TW', 'en-US']
const doUpdate = async () => {
  if (process.platform == 'win32') {
    try {
      await updater.checkForUpdates()
      await updater.downloadUpdate()
    } catch (e) {
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
    console.log('Update from poi.io available')
  })

  updater.on('update-downloaded', () => {
    window.toast(i18next.t('Quit app and install updates'), {
      type: 'success',
      title: i18next.t('Update successful'),
    })
  })

  updater.on('update-not-available', () => {
    console.warn('Update from poi.io not available')
  })

  updater.on('error', (event, error) => {
    window.toast(i18next.t('Please try again or download manually'), {
      type: 'danger',
      title: i18next.t('Update failed'),
    })
  })
}

export const checkUpdate = async () => {
  const betaChannel = config.get('poi.betaChannel', false)
  const versionInfo = await fetch(`https://${global.SERVER_HOSTNAME}/update/latest.json`, defaultFetchOption)
    .then(res => res.json())
    .catch(e => {
      console.warn('Check update error.', e.stack)
      return {}
    })
  if (versionInfo.version) {
    const version = betaChannel && semver.gt(versionInfo.betaVersion, versionInfo.version) ? versionInfo.betaVersion || 'v0.0.0' : versionInfo.version
    const channel = version.includes('beta') ? '-beta' : ''
    // eslint-disable-next-line no-console
    console.log(`Remote version: ${version}. Current version: ${POI_VERSION}`)
    const knownVersion = config.get('poi.update.knownVersion', POI_VERSION)

    if (semver.lt(POI_VERSION, version) && semver.lt(knownVersion, version)) {
      const currentLang = LANG.includes(language) ? language : 'en-US'
      const log = await fetch(`https://${global.SERVER_HOSTNAME}/update/${currentLang}${channel}.md`, defaultFetchOption)
        .then(res => res.text())
        .catch(res => {
          console.warn('fetch update log error')
          return ""
        })
      toggleUpdate(version, log)
    }
  }
}

const toggleUpdate = (version, log) => {
  const title = <span>{i18next.t('Update')} poi-{version}</span>
  // react-remarkable uses remarkable as parser，
  // remarkable disables HTML by default，
  // react-remarkable's default option dose not enable HTML，
  // it could be considered safe
  const content = (
    <Markdown source={log} />
  )
  const footer = [
    {
      name: i18next.t('I know'),
      func: () => config.set('poi.update.knownVersion', version),
      style: 'success',
    },
    {
      name: `${i18next.t('Manually download')}`,
      func: () => shell.openExternal('https://poi.io'),
      style: 'primary',
    },
  ]
  if (process.platform === 'win32') {
    footer.push({
      name: `${i18next.t('Auto update')}`,
      func: doUpdate,
      style: 'primary',
    })
  }
  toggleModal(title, content, footer)
}


if (config.get('poi.update.enable', true)) {
  setTimeout(checkUpdate, 5000 )
}
