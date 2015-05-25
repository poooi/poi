path = require 'path-extra'
{$, $$, _, React, ReactBootstrap, ROOT} = window

Slotitems = React.createClass
  render: ->
    <div className="slotitem-container">
      {
        # Update global data
        if {$slotitems, _slotitems} = window
          null
      }
      {
        for itemId in @props.data
          continue if itemId == -1
          item = _.find _slotitems, (e) ->
            e.api_id == itemId
          itemInfo = $slotitems[item.api_slotitem_id]
          <img key={itemId} src={path.join('assets', 'img', 'slotitem', "#{itemInfo.api_type[3]}.png")} alt={itemInfo.api_name} />
      }
    </div>

module.exports = Slotitems
