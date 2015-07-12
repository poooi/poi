path = require 'path-extra'
{$, $$, _, React, ReactBootstrap, ROOT} = window
{OverlayTrigger, Tooltip} = ReactBootstrap

Slotitems = React.createClass
  render: ->
    <div className="slotitems">
    {
      {$slotitems, _slotitems} = window
      for itemId, i in @props.data
        continue if itemId == -1
        item = _slotitems[itemId]
        <div className="slotitem-container">
          <OverlayTrigger placement='left' overlay={<Tooltip>{item.api_name}{if item.api_level > 0 then <strong style={color: '#45A9A5'}>★+{item.api_level}</strong> else ''}</Tooltip>}>
            <img key={itemId} src={path.join('assets', 'img', 'slotitem', "#{item.api_type[3] + 33}.png")} />
          </OverlayTrigger>
          <span className="slotitem-onslot
                          #{if (item.api_type[3] >= 6 && item.api_type[3] <= 10) || (item.api_type[3] >= 21 && item.api_type[3] <= 22) || item.api_type[3] == 33 then 'show' else 'hide'}
                          #{if @props.onslot[i] < @props.maxeq[i] then 'text-warning' else ''}">
            {@props.onslot[i]}
          </span>
        </div>
    }
    </div>

module.exports = Slotitems
