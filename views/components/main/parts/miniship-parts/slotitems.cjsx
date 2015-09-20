path = require 'path-extra'
{$, $$, _, React, ReactBootstrap, ROOT} = window
{OverlayTrigger, Tooltip} = ReactBootstrap
getBackgroundStyle = ->
  if window.isDarkTheme
    backgroundColor: 'rgba(33, 33, 33, 0.7)'
  else
    backgroundColor: 'rgba(256, 256, 256, 0.7)'
Slotitems = React.createClass
  render: ->
    <div className="slotitems">
    {
      {$slotitems, _slotitems} = window
      for itemId, i in @props.data
        continue unless itemId != -1 && _slotitems[itemId]?
        item = _slotitems[itemId]
        <div key={i} className="slotitem-container">
          <OverlayTrigger placement='left' overlay={
            <Tooltip>
              {item.api_name}
              {if item.api_level > 0 then <strong style={color: '#45A9A5'}>★+{item.api_level}</strong> else ''}
              {
                if item.api_alv? and item.api_alv >=1 and item.api_alv <= 3
                  for j in [1..item.api_alv]
                    <strong key={j} style={color: '#3EAEFF'}>|</strong>
                else if item.api_alv? and item.api_alv >= 4 and item.api_alv <= 6
                  for j in [1..item.api_alv - 3]
                    <strong key={j} style={color: '#F9C62F'}>\</strong>
                else if item.api_alv? and item.api_alv >= 7 and item.api_alv <= 9
                  <strong key={j} style={color: '#F9C62F'}> <FontAwesome key={0} name='angle-double-right'/> </strong>
                else if item.api_alv? and item.api_alv >= 9
                  <strong key={j} style={color: '#F94D2F'}>★</strong>
                else ''
              }
            </Tooltip>
          }>
            <span>
              <img key={itemId} src={path.join('assets', 'img', 'slotitem', "#{item.api_type[3] + 100}.png")} />
              <span className="slotitem-onslot
                              #{if (item.api_type[3] >= 6 && item.api_type[3] <= 10) || (item.api_type[3] >= 21 && item.api_type[3] <= 22) || item.api_type[3] == 33 || i == 5 then 'show' else 'hide'}
                              #{if @props.onslot[i] < @props.maxeq[i] && i != 5 then 'text-warning' else ''}"
                              style={getBackgroundStyle()}>
                {if i == 5 then '+' else @props.onslot[i]}
              </span>
            </span>
          </OverlayTrigger>
        </div>
    }
    </div>

module.exports = Slotitems
