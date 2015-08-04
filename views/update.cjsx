path = require 'path-extra'
i18n = require 'i18n'
{POI_VERSION} = window
{remote} = window
{React, ReactBootstrap, toggleModal} = window
updateManager = remote.require './lib/update'

# i18n configure
i18n.configure({
    locales:['en-US', 'ja-JP', 'zh-CN'],
    defaultLocale: 'zh-CN',
    directory: path.join(__dirname, "i18n"),
    updateFiles: false,
    indent: "\t",
    extension: '.json'
})
i18n.setLocale(window.language)

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
      title = <span>{i18n.__ "Update"} poi-v{info.version}</span>
      content =
        <div dangerouslySetInnerHTML={__html: info.log} />
      footer = [
        name: i18n.__ 'Download latest version',
        func: doUpdate,
        style: 'primary'
      ]
      toggleModal title, content, footer

setTimeout checkUpdate, 5000
