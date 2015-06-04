{React} = window

ShipInfoTableArea = require './ship-info-table-area'
ShipInfoCheckboxArea = require './ship-info-checkbox-area'

ShipInfoArea = React.createClass
  getInitialState: ->
    sortName: "id"
    sortOrder: 0
    shipTypeBoxes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
                    14, 15, 16, 17, 18, 19, 20, 21]

  sortRules: (name, order) ->
    {shipTypeBoxes} = @state
    @setState
      sortName: name
      sortOrder: order
      shipTypeBoxes: shipTypeBoxes

  filterRules: (boxes) ->
    {sortName, sortOrder} = @state
    @setState
      sortName: sortName
      sortOrder: sortOrder
      shipTypeBoxes: boxes

  render: ->
    <div>
      <ShipInfoCheckboxArea sortRules={@sortRules} filterRules={@filterRules} />
      <ShipInfoTableArea sortName={@state.sortName} sortOrder={@state.sortOrder} shipTypeBoxes={@state.shipTypeBoxes} />
    </div>

React.render <ShipInfoArea />, $('ship-info')
