path = require 'path-extra'
{$, $$, _, React, ReactBootstrap, ROOT} = window
{OverlayTrigger, Tooltip} = ReactBootstrap
{SlotitemIcon} = require '../etc/icon'
getBackgroundStyle = ->
  if window.isDarkTheme
    backgroundColor: 'rgba(33, 33, 33, 0.7)'
  else
    backgroundColor: 'rgba(256, 256, 256, 0.7)'
Slotitems = React.createClass
  getInitialState: ->
    slots: []
  shouldComponentUpdate: (nextProps, nextState) ->
    not _.isEqual nextProps, @props or not _.isEqual nextState, @state
    true
  setSlotsData: (data)->
    slots = []
    {_slotitems} = window
    for val, i in data
      continue unless val?
      itemId = val.id
      item = _slotitems[itemId] || {api_name: "", api_type: [0, 0, 0, 0]}
      slots[i] =
        isExist: _slotitems[itemId]?
        name: item.api_name
        level: item.api_level
        alv: item.api_alv
        slotitemId: item.api_type[3]
    @setState
      slots: slots
  componentWillMount: ->
    @setSlotsData @props.slots
  componentWillReceiveProps: (nextProps) ->
    @setSlotsData nextProps.slots
  render: ->
    <div className="slotitems">
    {
      {_slotitems} = window
      {slots} = @state
      for val, i in @props.slots
        continue unless val?
        itemId = val.id
        item = slots[i]
        itemOverlay = if item.isExist
          <Tooltip id="fleet-#{@props.fleet}-slot-#{@props.key}-item-#{i}-level">
            {i18n.resources.__ item.name}
            {
              if item.level? and item.level > 0
                <strong style={color: '#45A9A5'}> ★{item.level}</strong>
            }
            {
              if item.alv? and 1 <= item.alv <= 7
                <img className='alv-img' src={path.join('assets', 'img', 'airplane', "alv#{item.alv}.png")} />
            }
          </Tooltip>

        itemSpan =
          <span>
            <SlotitemIcon key={itemId} className='slotitem-img' slotitemId={item.slotitemId} />
            <span className="slotitem-onslot
                            #{if (i == 5) or (item.slotitemId == 0) or (6 <= item.slotitemId <= 10) or (21 <= item.slotitemId <= 22) or (item.slotitemId == 33) then 'show' else 'hide'}
                            #{if val.onslot < val.maxeq then 'text-warning'}"
                            style={getBackgroundStyle()}>
              {if i == 5 then "+" else val.onslot}
            </span>
          </span>

        <div key={i} className="slotitem-container">
        {
          if itemOverlay
            <OverlayTrigger placement='left' overlay={itemOverlay}>
              {itemSpan}
            </OverlayTrigger>
          else
            itemSpan
        }
        </div>
    }
    </div>

module.exports = Slotitems
