__ = i18n.others.__.bind(i18n.others)
__n = i18n.others.__n.bind(i18n.others)
{POI_VERSION} = window
{remote} = window
{React, ReactBootstrap, toggleModal} = window
updateManager = remote.require './lib/update'
{shell} = require 'electron'
semver = require 'semver'

updateInfo = null

doUpdate = ->
  shell.openExternal 'http://poi.io'

doUpdateGithub = ->
  shell.openExternal 'https://github.com/poooi/poi/releases'

checkUpdate = ->
  updateManager.checkUpdate (info) ->
    if info == 'error'
      console.log 'Check update error.'
      return
    console.log "Remote version: #{info.version}. Current version: #{POI_VERSION}"
    knownVersion = config.get 'poi.update.knownVersion', POI_VERSION
    if semver.lt(POI_VERSION, info.version) and semver.lt(knownVersion, info.version)
      title = <span>{__ 'Update'} poi-v{info.version}</span>
      content =
        <div dangerouslySetInnerHTML={__html: info.log} />
      footer = [
        {
          name: __ 'I know'
          func: -> config.set 'poi.update.knownVersion', info.version
          style: 'success'
        },
        {
          name: "#{__('Download latest version')} (#{__('Aliyun')})"
          func: doUpdate
          style: 'primary'
        },
        {
          name: "#{__('Download latest version')} (Github)"
          func: doUpdateGithub
          style: 'primary'
        }
      ]
      toggleModal title, content, footer

setTimeout checkUpdate, 5000 if config.get 'poi.update.enable', true
