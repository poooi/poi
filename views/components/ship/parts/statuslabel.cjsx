{$, $$, _, React, ReactBootstrap} = window
{Label} = ReactBootstrap

###
# usage:
# get a ship's all status using props, sorted by status priority
# status array: [retreat, repairing, special1, special2, special3]
# value: boolean
###
StatusLabel = React.createClass
  render: ->
    if @props.status[0]? and @props.status[0]
      <Label bsStyle="danger">退<br/>避</Label>
    else if @props.status[1]? and @props.status[1]
      <Label bsStyle="info">修<br/>理</Label>
    else if @props.status[2]? and @props.status[2]
      <Label bsStyle="warning">未<br/>知</Label>
    else if @props.status[3]? and @props.status[3]
      <Label bsStyle="primary">未<br/>知</Label>
    else if @props.status[4]? and @props.status[4]
      <Label bsStyle="success">未<br/>知</Label>
    else
      <div></div>

module.exports = StatusLabel
