import React from 'react'
import { shell } from 'electron'
import semver from 'semver'
import Promise from 'bluebird'
import Markdown from 'react-remarkable'
import path from 'path'

const {POI_VERSION, i18n, toggleModal, config, language} = window
const __ = i18n.others.__.bind(i18n.others)
const __n = i18n.others.__n.bind(i18n.others)

const request = Promise.promisifyAll(require('request'))
const requestAsync = Promise.promisify(request, {multiArgs: true})

const {error} = require('../../lib/utils')

const LANG = ['zh-CN', 'zh-TW', 'en-US']

const doUpdate = () =>
  shell.openExternal('http://poi.io')

const doUpdateGithub = () =>
  shell.openExternal('https://github.com/poooi/poi/releases')

const checkUpdate = async () => {
  let response
  let body
  try {
    [response, body] = await requestAsync(`http://${global.SERVER_HOSTNAME}/update/latest.json`, {
      method: 'GET',
      json: true,
      headers: {
        'User-Agent': `poi v${POI_VERSION}`,
      },
    })
  } catch (e) {
    error(e.stack)
    console.log('Check update error.')
  }

  if ((response || {}).statusCode === 200){
    const version = body.version
    console.log(`Remote version: ${version}. Current version: ${POI_VERSION}`)
    const knownVersion = config.get('poi.update.knownVersion', POI_VERSION)

    if (semver.lt(POI_VERSION, version) && semver.lt(knownVersion, version)) {
      let resp
      let log
      try {
        const currentLang = LANG.includes(language) ? language : 'en-US'
        ;[resp, log] = await requestAsync(`http://${global.SERVER_HOSTNAME}/update/${currentLang}.md`, {
          method: 'GET',
          headers: {
            'User-Agent': `poi v${POI_VERSION}`,
          },
        })
        if ((resp || {}).statusCode != 200) {
          console.log('fetch update log error')
          log = ''
        }
        toggleUpdate(version, log)
      } catch (e) {
        error(e.stack)
        console.log('fetch update log error')
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
      name: `${__('Download latest version')} (${__('Aliyun')})`,
      func: doUpdate,
      style: 'primary',
    },
    {
      name: `${__('Download latest version')} (Github)`,
      func: doUpdateGithub,
      style: 'primary',
    },
  ]
  toggleModal(title, content, footer)
}


if (config.get('poi.update.enable', true)) {
  setTimeout(checkUpdate, 5000 )
}
