{POI_VERSION} = window
{remote} = window
{React, ReactBootstrap, toggleModal} = window
{PageHeader} = ReactBootstrap
updateManager = remote.require './lib/update'
shell = require 'shell'

updateInfo = null

doUpdate = ->
  shell.openExternal 'http://0u0.moe/poi'

checkUpdate = ->
  updateManager.checkUpdate (info) ->
    if info == 'error'
      console.log 'Check update error.'
      return
    console.log "Remote version: #{info.version}. Current version: #{POI_VERSION}"
    if info.version != POI_VERSION
      updateInfo = info
      title = '更新版本'
      content =
        <div>
          <PageHeader>poi v{info.version}</PageHeader>
          <div dangerouslySetInnerHTML={__html: info.log} />
        </div>
      footer = [
        name: '下载最新版',
        func: doUpdate,
        style: 'primary'
      ]
      toggleModal title, content, footer

setTimeout checkUpdate, 5000
