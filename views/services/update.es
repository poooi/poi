import React from 'react'
import { shell } from 'electron'
import semver from 'semver'

const {POI_VERSION, remote, i18n, toggleModal, config} = window
const __ = i18n.others.__.bind(i18n.others)
const __n = i18n.others.__n.bind(i18n.others)

const updateManager = remote.require('./lib/update')

const doUpdate = () =>
  shell.openExternal('http://poi.io')

const doUpdateGithub = () =>
  shell.openExternal('https://github.com/poooi/poi/releases')

const checkUpdate = async() => {
  const info = await updateManager.checkUpdate()
  if (info === 'error') {
    console.log('Check update error.')
    return
  }
  console.log(`Remote version: ${info.version}. Current version: ${POI_VERSION}`)
  const knownVersion = config.get('poi.update.knownVersion', POI_VERSION)
  if (semver.lt(POI_VERSION, info.version) && semver.lt(knownVersion, info.version)) {
    const title = <span>{__('Update')} poi-v{info.version}</span>
    const content =
      <div dangerouslySetInnerHTML={{__html: info.log}} />
    const footer = [
      {
        name: __('I know'),
        func: () => config.set('poi.update.knownVersion', info.version),
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
  }}

if (config.get('poi.update.enable', true)) {
  setTimeout(checkUpdate, 5000 )
}
