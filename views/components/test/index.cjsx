path = require 'path-extra'
{layout, ROOT, $, $$, React, ReactBootstrap, remote} = window
{Button} = ReactBootstrap
windowManager = remote.require './lib/window'
win = windowManager.createWindow
  height: 800
  width: 600
win.loadUrl "file://#{__dirname}/index.html"
module.exports =
  name: 'TestWindow'
  priority: 50
  displayName: '测试'
  description: '测试'
  reactClass: React.createClass
    handleShow: ->
      win.show()
    handleHide: ->
      win.close()
    render: ->
      <div>
        <Button onClick={@handleShow}>Show</Button>
        <Button onClick={@handleHide}>Hide</Button>
      </div>
