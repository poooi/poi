{React, ReactBootstrap, FontAwesome} = window
{Button} = ReactBootstrap
remote = require 'remote'
windowManager = remote.require './lib/window'

shipInfoWindow = null
initialShipInfoWindow = ->
  shipInfoWindow = windowManager.createWindow
    #Use config
    x: 0
    y: 0
    width: 800
    height: 600
  shipInfoWindow.loadUrl "file://#{__dirname}/index.html"
  shipInfoWindow.openDevTools
    detach: true
initialShipInfoWindow()

module.exports =
  name: 'ShipInfo'
  priority: 50
  displayName: [<FontAwesome name='ship' key={0} />, ' 舰娘信息']
  description: '提供已有舰娘详细信息查看'
  handleClick: ->
    shipInfoWindow.show()
