{_, $, $$, React, ReactBootstrap, FontAwesome} = window
{OverlayTrigger, Tooltip, Label} = ReactBootstrap
{__, __n} = require 'i18n'

StatusLabel = React.createClass
  shouldComponentUpdate: (nextProps, nextState) ->
    not _.isEqual(nextProps.label, @props.label)
  render: ->
    if @props.label? and @props.label == 0
      <OverlayTrigger placement="top" overlay={<Tooltip>{__ 'Retreated'}</Tooltip>}>
        <Label bsStyle="danger"><FontAwesome key={0} name='exclamation-circle' /></Label>
      </OverlayTrigger>
    else if @props.label? and @props.label == 1
      <OverlayTrigger placement="top" overlay={<Tooltip>{__ 'Repairing'}</Tooltip>}>
        <Label bsStyle="info"><FontAwesome key={0} name='wrench' /></Label>
      </OverlayTrigger>
    else if @props.label? and @props.label == 2
      <OverlayTrigger placement="top" overlay={<Tooltip>{__ 'Ship tag: %s', 'E1, E2, E7'}</Tooltip>}>
        <Label bsStyle="info"><FontAwesome key={0} name='tag' /></Label>
      </OverlayTrigger>
    else if @props.label? and @props.label == 3
      <OverlayTrigger placement="top" overlay={<Tooltip>{__ 'Ship tag: %s', 'E3, E6, E7'}</Tooltip>}>
        <Label bsStyle="primary"><FontAwesome key={0} name='tag' /></Label>
      </OverlayTrigger>
    else if @props.label? and @props.label == 4
      <OverlayTrigger placement="top" overlay={<Tooltip>{__ 'Ship tag: %s', 'E4, E7'}</Tooltip>}>
        <Label bsStyle="success"><FontAwesome key={0} name='tag' /></Label>
      </OverlayTrigger>
    else if @props.label? and @props.label == 5
      <OverlayTrigger placement="top" overlay={<Tooltip>{__ 'Ship tag: %s', 'E5'}</Tooltip>}>
        <Label bsStyle="warning"><FontAwesome key={0} name='tag' /></Label>
      </OverlayTrigger>
    else if @props.label? and @props.label == 6
      <OverlayTrigger placement="top" overlay={<Tooltip>{__ 'Resupply needed'}</Tooltip>}>
        <Label bsStyle="warning"><FontAwesome key={0} name='database' /></Label>
      </OverlayTrigger>
    else
      <Label bsStyle="default" style={opacity: 0}></Label>

module.exports = StatusLabel
