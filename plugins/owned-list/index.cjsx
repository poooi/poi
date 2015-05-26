{React, ReactBootstrap} = window
{Button} = ReactBootstrap
remote = require 'remote'
BrowserWindow = remote.require 'browser-window'

module.exports = 
  name: 'OwnedList'
  priority: 50
  displayName: '详细信息'
  description: '提供已有舰娘和已有装备详细信息查看'
  reactClass: React.createClass
    shipInfoWindow: new BrowserWindow
      #Need test / use config?
      x: 0
      y: 0
      width: 800
      height: 600
      show: false
      
    initialShipInfoWindow: ->
      @shipInfoWindow.loadUrl "file://#{__dirname}/parts/info-panel/ships/index.html" 
      ###
      issue code: failed to hide the window
      @shipInfoWindow.onbeforeunload = (e) ->
        @shipInfoWindow.hide()
        false
      
      or

      @shipInfoWindow.on 'close', () ->
        @shipInfoWindow.preventDefault()
        @shipInfoWindow.hide()
      ###

    handleClickShipButton: ->
      @shipInfoWindow.show()

    handleTest: ->
      @shipInfoWindow.hide()

    render: ->
      @initialShipInfoWindow()
      <div>
        <Button bsStyle='info' bsSize='large' block onClick={@handleClickShipButton} >舰娘信息</Button>
        <Button bsStyle='info' bsSize='large' block onClick={@handleTest} >装备信息</Button> 
      </div>