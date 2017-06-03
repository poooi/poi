import React from 'react'
import { shell, remote } from 'electron'
import semver from 'semver'
import Promise from 'bluebird'
import Markdown from 'react-remarkable'

const {POI_VERSION, i18n, toggleModal, config, language} = window
const __ = i18n.others.__.bind(i18n.others)

const request = Promise.promisifyAll(require('request'))
const requestAsync = Promise.promisify(request, {multiArgs: true})
const { updater } = process.platform !== 'linux' ? remote.require('./lib/updater') : {}

const {error} = require('../../lib/utils')

const LANG = ['zh-CN', 'zh-TW', 'en-US']

const openHomePage = () =>
  shell.openExternal('https://poi.io')

const doUpdate = async () => {
  if (process.platform == 'win32') {
    try {
      await updater.checkForUpdates()
      await updater.downloadUpdate()
    } catch (e) {
      window.toast(__('Please try again or download manually.'), {
        type: 'danger',
        title: __('Update failed'),
      })
    }
  }
}

if (process.platform === 'win32') {
  updater.on('update-available', () => {
    console.log('Update from poi.io available')
  })

  updater.on('update-downloaded', () => {
    window.toast(__('Quit app and install updates'), {
      type: 'success',
      title: __('Update successful'),
    })
  })

  updater.on('update-not-available', () => {
    console.warn('Update from poi.io not available')
  })

  updater.on('error', (event, error) => {
    window.toast(__('Please try again or download manually'), {
      type: 'danger',
      title: __('Update failed'),
    })
  })
}

export const checkUpdate = async () => {
  let response
  let body
  const betaChannel = config.get('poi.betaChannel', false)
  try {
    [response, body] = await requestAsync(`https://${global.SERVER_HOSTNAME}/update/latest.json`, {
      method: 'GET',
      json: true,
      headers: {
        'User-Agent': `poi v${POI_VERSION}`,
      },
    })
  } catch (e) {
    error(e.stack)
    console.warn('Check update error.')
  }

  if ((response || {}).statusCode === 200){
    const version = betaChannel && semver.gt(body.betaVersion, body.version) ? body.betaVersion || 'v0.0.0' : body.version
    const channel = version.includes('beta') ? '-beta' : ''
    console.log(`Remote version: ${version}. Current version: ${POI_VERSION}`)
    const knownVersion = config.get('poi.update.knownVersion', POI_VERSION)

    if (semver.lt(POI_VERSION, version) && semver.lt(knownVersion, version)) {
      let resp
      let log
      try {
        const currentLang = LANG.includes(language) ? language : 'en-US'
        ;[resp, log] = await requestAsync(`https://${global.SERVER_HOSTNAME}/update/${currentLang}${channel}.md`, {
          method: 'GET',
          headers: {
            'User-Agent': `poi v${POI_VERSION}`,
          },
        })
        if ((resp || {}).statusCode != 200) {
          console.warn('fetch update log error')
          log = ''
        }
        toggleUpdate(version, log)
      } catch (e) {
        error(e.stack)
        console.warn('fetch update log error')
      }
    }
  }
}

const toggleUpdate = (version, log) => {
  const title = <span>{__('Update')} poi-v{version}</span>
  // react-remarkable uses remarkable as parser，
  // remarkable disables HTML by default，
  // react-remarkable's default option dose not enable HTML，
  // it could be considered safe
  const content = (
    <Markdown source={log} />
  )
  const footer = [
    {
      name: __('I know'),
      func: () => config.set('poi.update.knownVersion', version),
      style: 'success',
    },
    {
      name: `${__('Manually download')}`,
      func: openHomePage,
      style: 'primary',
    },
  ]
  if (process.platform === 'win32') {
    footer.push({
      name: `${__('Auto update')}`,
      func: doUpdate,
      style: 'primary',
    })
  }
  toggleModal(title, content, footer)
}


if (config.get('poi.update.enable', true)) {
  setTimeout(checkUpdate, 5000 )
}
