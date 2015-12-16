{_, $, $$, React, ReactBootstrap, FontAwesome} = window
{OverlayTrigger, Tooltip, Label} = ReactBootstrap
__ = i18n.__.bind(i18n)
__n = i18n.__n.bind(i18n)

texts = [
  ['Retreated'],
  ['Repairing'],
  ['Ship tag: %s', 'E1, E2, E3'],
  ['Ship tag: %s', 'E4'],
  ['Ship tag: %s', '?'],
  ['Ship tag: %s', '?'],
  ['Resupply needed']
]

styles = [
  'danger',
  'info',
  'success',
  'warning',
  'primary',
  'info',
  'warning'
]

icons = [
  'exclamation-circle',
  'wrench',
  'tag',
  'tag',
  'tag',
  'tag',
  'database'
]

StatusLabel = React.createClass
  shouldComponentUpdate: (nextProps, nextState) ->
    not _.isEqual(nextProps.label, @props.label)
  render: ->
    i = @props.label
    if i? && 0 <= i <= 6
      <OverlayTrigger placement="top" overlay={<Tooltip id="statuslabel-status-#{i}">{__.apply(@, texts[i])}</Tooltip>}>
        <Label bsStyle={styles[i]}><FontAwesome key={0} name={icons[i]} /></Label>
      </OverlayTrigger>
    else
      <Label bsStyle="default" style={opacity: 0}></Label>

module.exports = StatusLabel
