{relative, join} = require 'path-extra'
path =  require 'path-extra'
{_, $, $$, React, ReactBootstrap, ROOT, FontAwesome, toggleModal} = window
{$ships, $shipTypes, _ships} = window
{Button, ButtonGroup} = ReactBootstrap
{ProgressBar, OverlayTrigger, Tooltip, Alert, Overlay, Label, Panel, Popover} = ReactBootstrap
__ = i18n.main.__.bind(i18n.main)
__n = i18n.main.__n.bind(i18n.main)
StatusLabel = require './statuslabel'
{SlotitemIcon} = require '../etc/icon'

{getHpStyle, getStatusStyle, getShipStatus, BaseShipData} = require './utils.coffee'

getFontStyle = (theme)  ->
  if window.isDarkTheme then color: '#FFF' else color: '#000'

Slotitems = React.createClass
  shouldComponentUpdate: (nextProps, nextState) ->
    not _.isEqual nextProps, @props
  render: ->
    <div className="slotitems-mini" style={display: "flex", flexFlow: "column"}>
    {
      for item, i in @props.data
        continue if !item? || item.id == -1
        itemId = item.id
        <div key={i} className="slotitem-container-mini">
          <SlotitemIcon key={itemId} className='slotitem-img' slotitemId={item.slotitemId} />
          <span className="slotitem-name-mini">
            {i18n.resources.__ item.name}
              {if item.level > 0 then <strong style={color: '#45A9A5'}> ★{item.level}</strong> else ''}
              &nbsp;&nbsp;{
                if item.alv? and 1 <= item.alv <= 7
                  <img className='alv-img' src={join('assets', 'img', 'airplane', "alv#{item.alv}.png")} />
                else ''
              }
          </span>
          <Label className="slotitem-onslot-mini
                          #{if (item.slotitemId >= 6 && item.slotitemId <= 10) || (item.slotitemId >= 21 && item.slotitemId <= 22) || item.slotitemId == 33 then 'show' else 'hide'}"
                          bsStyle="#{if item.onslot < item.maxeq then 'warning' else 'default'}">
            {item.onslot}
          </Label>
        </div>
    }
    </div>

MiniShipRow = React.createClass
  shouldComponentUpdate: (nextProps, nextState) ->
    not _.isEqual nextProps, @props
  render: ->
    <div className="ship-tile">
      <OverlayTrigger placement={if (!window.doubleTabbed) && (window.layout == 'vertical') then 'left' else 'right'} overlay={
        <Tooltip id="ship-pop-#{@props.key}-#{@props.shipIndex}" className="ship-pop #{if @props.shipData.slotItemExist then '' else 'hidden'}">
          <div className="item-name">
            <Slotitems data={@props.shipData.slotItems} />
          </div>
        </Tooltip>
      }>
        <div className="ship-item">
          <OverlayTrigger placement='top' overlay={
            <Tooltip id="miniship-exp-#{@props.key}-#{@props.shipIndex}">
              Next. {@props.shipData.nextEXP}
            </Tooltip>
          }>
            <div className="ship-info">
              <span className="ship-name" style={getStatusStyle @props.label}>
                {i18n.resources.__ @props.shipData.name}
              </span>
              <span className="ship-lv-text top-space" style={getStatusStyle @props.label}>
                Lv. {@props.shipData.lv}
              </span>
            </div>
          </OverlayTrigger>
          <div className="ship-stat">
            <div className="div-row">
              <span className="ship-hp" style={getStatusStyle @props.label}>
                {@props.shipData.nowHp} / {@props.shipData.maxHp}
              </span>
              <div className="status-label">
                <StatusLabel label={@props.label} />
              </div>
              <div style={getStatusStyle @props.label}>
                <span className={"ship-cond " + window.getCondStyle(@props.shipData.cond)}>
                  ★{@props.shipData.cond}
                </span>
              </div>
            </div>
            <span className="hp-progress top-space" style={getStatusStyle @props.label}>
              <ProgressBar bsStyle={getHpStyle @props.shipData.nowHp / @props.shipData.maxHp * 100} now={@props.shipData.nowHp / @props.shipData.maxHp * 100} />
            </span>
          </div>
        </div>
      </OverlayTrigger>
    </div>

module.exports =
  shipItem: MiniShipRow
  shipData: BaseShipData
  miniFlag: true
