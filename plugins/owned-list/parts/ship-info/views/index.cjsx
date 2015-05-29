{React} = window

ShipInfoTableArea = require './ship-info-table-area'
ShipInfoCheckboxArea = require './ship-info-checkbox-area'

ShipInfoArea = React.createClass
	getInitialState: ->
		sortName: "id"
		sortOrder: 0

	sortRules: (name, order) ->
		@setState
			sortName: name
			sortOrder: order

	render: ->
		<div>
			<ShipInfoCheckboxArea sortRules={@sortRules} />
			<ShipInfoTableArea sortName={@state.sortName} sortOrder={@state.sortOrder}/>
		</div>

React.render <ShipInfoArea />, $('ship-info')
