{React, ReactBootstrap, FontAwesome} = window
{Button} = ReactBootstrap
remote = require 'remote'
windowManager = remote.require './lib/window'

itemInfoWindow = null
initialItemInfoWindow = ->
  itemInfoWindow = windowManager.createWindow
    #Use config
    x: config.get 'poi.window.x', 0
    y: config.get 'poi.window.y', 0
    width: 1020
    height: 650
  itemInfoWindow.loadUrl "file://#{__dirname}/index.html"
  if process.env.DEBUG?
    itemInfoWindow.openDevTools
      detach: true
initialItemInfoWindow()

module.exports =
  name: 'ItemInfo'
  priority: 51
  displayName: [<FontAwesome name='rocket' key={0} />, ' 装备信息']
  description: '提供装备详细信息查看'
  handleClick: ->
    itemInfoWindow.show()
