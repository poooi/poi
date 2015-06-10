path = require 'path-extra'
{$, $$, _, React, ReactBootstrap, ROOT} = window

Slotitems = React.createClass
  render: ->
    <div className="slotitem-container">
      {
        {$slotitems, _slotitems} = window
        for itemId in @props.data
          continue if itemId == -1
          item = _slotitems[itemId]
          <img key={itemId} src={path.join('assets', 'img', 'slotitem', "#{item.api_type[3] + 33}.png")} title={item.api_name + if item.api_level > 0 then "★+#{item.api_level}" else '' } />
      }
    </div>

module.exports = Slotitems
