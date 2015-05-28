{React} = window

ShipInfoTableArea = require './ship-info-table-area'
ShipInfoCheckbox = require './ship-info-checkbox-area'

ShipInfoArea = React.createClass 
	render: ->
		<div>
			<ShipInfoCheckboxArea />
			<ShipInfoTableArea />
		</div>

React.render <ShipInfoArea />, $('ship-info')
