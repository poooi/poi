{__} = require 'i18n'
{POI_VERSION} = window
{remote} = window
{React, ReactBootstrap, toggleModal} = window
updateManager = remote.require './lib/update'
shell = require 'shell'
semver = require 'semver'

updateInfo = null

doUpdate = ->
  shell.openExternal 'http://0u0.moe/poi'

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
          name: __ 'Download latest version'
          func: doUpdate
          style: 'primary'
        }
      ]
      toggleModal title, content, footer

setTimeout checkUpdate, 5000 if config.get 'poi.update.enable', true
