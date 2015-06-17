path = require 'path-extra'
{$, $$, _, React, ReactBootstrap, ROOT} = window
{OverlayTrigger, Tooltip} = ReactBootstrap

Slotitems = React.createClass
  render: ->
    <div className="slotitem-container">
      {
        {$slotitems, _slotitems} = window
        for itemId in @props.data
          continue if itemId == -1
          item = _slotitems[itemId]
          <OverlayTrigger placement='left' overlay={<Tooltip>{item.api_name}{if item.api_level > 0 then <strong style={color: '#45A9A5'}>★+{item.api_level}</strong> else ''}</Tooltip>}>
            <img key={itemId} src={path.join('assets', 'img', 'slotitem', "#{item.api_type[3] + 33}.png")} />
          </OverlayTrigger>
      }
    </div>

module.exports = Slotitems
