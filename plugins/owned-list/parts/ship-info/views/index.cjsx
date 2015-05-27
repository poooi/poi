{React} = window

{ShipInfoTableArea} = require './parts'

ShipInfoArea = React.createClass 
	render: ->
		<div>
			<ShipInfoTableArea />
		</div>

React.render <ShipInfoArea />, $('ship-info')
