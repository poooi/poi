path = require 'path-extra'
{$, $$, _, React, ReactBootstrap, ROOT} = window

Slotitems = React.createClass
  render: ->
    <div className="slotitem-container">
      {
        {$slotitems, _slotitems} = window
        for itemId in @props.data
          continue if itemId == -1
          idx = _.sortedIndex _slotitems, {api_id: itemId}, 'api_id'
          item = _slotitems[idx]
          itemInfo = $slotitems[item.api_slotitem_id]
          <img key={itemId} src={path.join('assets', 'img', 'slotitem', "#{itemInfo.api_type[3] + 33}.png")} alt={itemInfo.api_name} title={itemInfo.api_name} />
      }
    </div>

module.exports = Slotitems
