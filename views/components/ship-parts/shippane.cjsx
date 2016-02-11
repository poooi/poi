{$, $$, _, React} = window
TopAlert = require './topalert'

{MiniShipData, ShipData, getShipStatus} = require './utils.coffee'
ShipItem = require './shipitem'
MiniShipItem = require './minishipitem'

class ShipPane extends React.Component
  constructor: (props) ->
    super props
    this.state =
      cond: [0, 0, 0, 0, 0, 0]
      label: [-1, -1, -1, -1, -1, -1]
      ships: []
    @type = props.type
    if props.type is 'MINI'
      @ShipData = MiniShipData
      @ShipItem = MiniShipItem
    else
      @ShipData = ShipData
      @ShipItem = ShipItem
    @condDynamicUpdateFlag = false
  updateLabels: ->
    # refresh label
    label = Object.clone @state.label
    for shipId, j in @props.deck.api_ship
      continue if shipId == -1
      ship = _ships[shipId]
      status = getShipStatus @type is 'MINI', shipId
      label[j] = status
    label
  onCondChange: (cond) ->
    condDynamicUpdateFlag = true
    @setState
      cond: cond
  handleResponse: (e) ->
    {method, path, body, postBody} = e.detail
    label = Object.clone @state.label
    updateflag = false
    switch path
      when '/kcsapi/api_port/port', '/kcsapi/api_req_hensei/change', '/kcsapi/api_req_nyukyo/speedchange', '/kcsapi/api_req_hensei/preset_select'
        updateflag = true
        label = @updateLabels()
      when '/kcsapi/api_req_hokyu/charge'
        if @type is 'MINI'
          updateflag = true
          label = @updateLabels()
      when '/kcsapi/api_req_nyukyo/start'
        if (postBody.api_highspeed == 1)
          updateflag = true
      when '/kcsapi/api_get_member/ndock'
        for shipId in _ndocks
          i = @props.deck.api_ship.indexOf shipId
          if i isnt -1
            label[i] = 1
            updateflag = true
    if updateflag
      @setState
        label: label
  shouldComponentUpdate: (nextProps, nextState) ->
    @props.deckName != nextProps.deckName || !_.isEqual(@state, nextState)
  setShipData: (props, flag) ->
    {_ships} = window
    if flag and @condDynamicUpdateFlag
      @condDynamicUpdateFlag = not @condDynamicUpdateFlag
    else
      cond = [0, 0, 0, 0, 0, 0]
      for shipId, j in props.deck.api_ship
        if shipId == -1
          cond[j] = 49
          continue
        ship = _ships[shipId]
        cond[j] = ship.api_cond
      ships = []
      for shipId, i in props.deck.api_ship
        continue if shipId is -1
        ships.push new @ShipData(shipId)
      @setState
        cond: cond
        ships: ships
  componentWillReceiveProps: (nextProps) ->
    @setShipData nextProps, true
  componentWillMount: ->
    @setShipData @props, false
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse.bind(@)
    label = @updateLabels()
    @setState
      label: label
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse.bind(@)
  render: ->
    <div>
      <div className='fleet-name'>
        <TopAlert
          updateCond={@onCondChange.bind(@)}
          messages={@props.messages}
          deckIndex={@props.deckIndex}
          deckName={@props.deckName}
          mini={@type is 'MINI'}
        />
      </div>
      <div className="ship-details#{if @type is 'MINI' then '-mini' else ''}">
        {
          {$shipTypes, _ships} = window
          for shipData, j in @state.ships
            React.createElement @ShipItem,
              key: shipData.id
              label: @state.label[j]
              shipData: shipData
              deckIndex: @props.deckIndex
              shipIndex: j
        }
      </div>
    </div>

ShipPane.propTypes =
  type: React.PropTypes.string
ShipPane.defaultProps =
  type: 'WHOLE'

module.exports = ShipPane
