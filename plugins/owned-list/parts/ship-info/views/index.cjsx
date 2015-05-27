{React} = window

{ShipInfoTableArea} = require './parts'

ShipInfoArea = React.createClass 
	render: ->
		<div>
		{
			React.createElement(ShipInfoTableArea.reactClass)
		}
		</div>

React.render <ShipInfoArea />, $('ship-info')
