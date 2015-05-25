{React, ReactBootstrap} = window
remote = require 'remote'
BrowserWindow = remote.require 'browser-window'

class ShipInfoWindow
	constructor: ->
		@initWindow()
	initWindow: ->
		infoWindow = new BrowserWindow
			#Need test / Use the config?
			x: 0
			y: 0
			width: 800
			height: 600
				
module.exports = new ShipInfoWindow