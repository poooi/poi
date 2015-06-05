{React, ReactBootstrap, FontAwesome} = window
{Button} = ReactBootstrap
remote = require 'remote'
windowManager = remote.require './lib/window'

shipInfoWindow = null
initialShipInfoWindow = ->
  shipInfoWindow = windowManager.createWindow
    #Use config
    x: config.get 'poi.window.x', 0
    y: config.get 'poi.window.y', 0
    width: 820
    height: 650
  shipInfoWindow.loadUrl "file://#{__dirname}/index.html"
  if process.env.DEBUG?
    shipInfoWindow.openDevTools
      detach: true
initialShipInfoWindow()

module.exports =
  name: 'ShipInfo'
  priority: 50
  displayName: [<FontAwesome name='ship' key={0} />, ' 舰娘信息']
  author: 'Yunze'
  link: 'https://github.com/myzwillmake'
  description: '提供已有舰娘详细信息查看'
  handleClick: ->
    shipInfoWindow.show()
