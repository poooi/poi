{POI_VERSION} = window
{remote} = window
{React, ReactBootstrap, toggleModal} = window
updateManager = remote.require './lib/update'
shell = require 'shell'

updateInfo = null

doUpdate = ->
  shell.openExternal 'http://0u0.moe/poi'

isNewVersion = (va, vb) ->
  va = va + '-stable' if va.indexOf('-') == -1
  vb = vb + '-stable' if vb.indexOf('-') == -1
  va < vb

checkUpdate = ->
  updateManager.checkUpdate (info) ->
    if info == 'error'
      console.log 'Check update error.'
      return
    console.log "Remote version: #{info.version}. Current version: #{POI_VERSION}"
    if isNewVersion(POI_VERSION, info.version)
      updateInfo = info
      title = <span>更新 poi-v{info.version}</span>
      content =
        <div dangerouslySetInnerHTML={__html: info.log} />
      footer = [
        name: '下载最新版',
        func: doUpdate,
        style: 'primary'
      ]
      toggleModal title, content, footer

setTimeout checkUpdate, 5000
