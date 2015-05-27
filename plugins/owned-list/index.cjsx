{React, ReactBootstrap} = window
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

  shipInfoWindow.loadUrl "file://#{__dirname}/parts/ship-info/index.html"
  shipInfoWindow.openDevTools
    detach: true 

initialShipInfoWindow()

module.exports = 
  name: 'OwnedList'
  priority: 50
  displayName: '详细信息'
  description: '提供已有舰娘和已有装备详细信息查看'
  reactClass: React.createClass

    handleClickShipButton: ->
      shipInfoWindow.show()

    render: ->
      <div>
        <Button bsStyle='info' bsSize='large' block onClick={@handleClickShipButton} >舰娘信息</Button>
        <Button bsStyle='info' bsSize='large' block >装备信息</Button> 
      </div>