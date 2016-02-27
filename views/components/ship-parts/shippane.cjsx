{$, $$, _, React} = window
TopAlert = require './topalert'

{getShipStatus} = require './utils'

class ShipPane extends React.Component
  constructor: (props) ->
    super props
    this.state =
      label: [-1, -1, -1, -1, -1, -1]
      ships: []
    @miniFlag = props.miniFlag
    @ShipData = props.shipData
    @ShipItem = props.shipItem
    @condDynamicUpdateFlag = false
  updateLabels: ->
    # refresh label
    label = Object.clone @state.label
    for shipId, j in @props.deck.api_ship
      continue if shipId == -1
      label[j] = getShipStatus @miniFlag, shipId
    label
  onCondChange: (cond) ->
    condDynamicUpdateFlag = true
    ships = Object.clone @state.ships
    for shipData, j in ships
      ships[j].cond = cond[j]
      window._ships[shipData.id].api_cond = cond[j]
    @setState
      ships: ships
  handleResponse: (e) ->
    {method, path, body, postBody} = e.detail
    label = Object.clone @state.label
    updateflag = false
    switch path
      when '/kcsapi/api_port/port', '/kcsapi/api_req_hensei/change', '/kcsapi/api_req_nyukyo/speedchange', '/kcsapi/api_req_hensei/preset_select'
        updateflag = true
        label = @updateLabels()
      when '/kcsapi/api_req_hokyu/charge'
        if @miniFlag
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
  setShipData: (props) ->
    if @condDynamicUpdateFlag
      @condDynamicUpdateFlag = not @condDynamicUpdateFlag
    else
      ships = []
      for shipId, i in props.deck.api_ship
        continue if shipId is -1
        ships.push new @ShipData(shipId)
      @setState
        ships: ships
  componentWillReceiveProps: (nextProps) ->
    @setShipData nextProps
  componentWillMount: ->
    @setShipData @props
    @handleResponseWithThis = @handleResponse.bind(@)
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponseWithThis
    label = @updateLabels()
    @setState
      label: label
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponseWithThis
  render: ->
    <div>
      <div className='fleet-name'>
        <TopAlert
          updateCond={@onCondChange.bind(@)}
          messages={@props.messages}
          deckIndex={@props.deckIndex}
          deckName={@props.deckName}
          mini={@miniFlag}
        />
      </div>
      <div className="ship-details#{if @miniFlag then '-mini' else ''}">
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
  miniFlag: React.PropTypes.bool
  shipData: React.PropTypes.func
  shipItem: React.PropTypes.func

module.exports = ShipPane
