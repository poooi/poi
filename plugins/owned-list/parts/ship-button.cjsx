{React, ReactBootstrap} = window
{Button} = ReactBootstrap 

ShipButton = React.createClass
	handleClick: ->
		infoWindow = require './info-panel/ship-info-window'
	render: -> 
		<Button bsStyle='info' bsSize='large' block onClick={@handleClick} >舰娘信息</Button>

module.exports = ShipButton