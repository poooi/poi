{POI_VERSION} = window
{remote} = window
{React, ReactBootstrap, toggleModal} = window
{PageHeader} = ReactBootstrap
updateManager = remote.require './lib/update'

updateInfo = null

doUpdate = ->
  updateManager.update updateInfo, (res) ->
    if res == 'error'
      console.log 'Update error.'
      return
    title = '更新完成'
    content = '请重新打开 poi 使得更新生效'
    toggleModal title, content

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
        name: '更新',
        func: doUpdate,
        style: 'primary'
      ]
      toggleModal title, content, footer

setTimeout checkUpdate, 5000
