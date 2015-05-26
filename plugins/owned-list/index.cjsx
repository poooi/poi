{React, ReactBootstrap} = window
{Button} = ReactBootstrap
remote = require 'remote'
BrowserWindow = remote.require 'browser-window'

shipInfoWindow = null

initialShipInfoWindow = ->
  shipInfoWindow = new BrowserWindow
    #Use cconfig
    x: 0
    y: 0
    width: 800
    height: 600
    show: false

  shipInfoWindow.loadUrl "file://#{__dirname}/parts/info-panel/ships/index.html"
  shipInfoWindow.openDevTools
    detach: true 
  shipInfoWindow.onbeforeunload = ->
    false
    ###
  shipInfoWindow.on 'close', (e) =>
    console.log "It works!"
    e.preventDefault()
    shipInfoWindow.hide()
    ###
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
        <Button bsStyle='info' bsSize='large' block onClick={@handleTest} >装备信息</Button> 
      </div>