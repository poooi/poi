import React from 'react'
import FontAwesome from 'react-fontawesome'
import { OverlayTrigger, Tooltip, Label } from 'react-bootstrap'

const {i18n} = window
const __ = i18n.main.__.bind(i18n.main)

const texts = [
  ['Retreated'],
  ['Repairing'],
  ['Resupply needed'],
  ['Ship tag: %s', 'E1'],
  ['Ship tag: %s', 'E2'],
  ['Ship tag: %s', 'E3'],
  ['Ship tag: %s', ''],
]
const styles = [
  'warning',
  'info',
  'warning',
  'primary',
  'success',
  'info',
  '',
]
const icons = [
  'reply',
  'wrench',
  'database',
  'tag',
  'tag',
  'tag',
  'tag',
]

class StatusLabel extends React.Component {
  shouldComponentUpdate = (nextProps, nextState) => (
    nextProps.label !== this.props.label
  )
  render() {
    const i = this.props.label
    if (i != null && 0 <= i && i <= 6) {
      return (
        <OverlayTrigger placement="top" overlay={<Tooltip id={`statuslabel-status-${i}`}>{__(texts[i])}</Tooltip>}>
          <Label bsStyle={styles[i]}><FontAwesome key={0} name={icons[i]} /></Label>
        </OverlayTrigger>
      )
    } else {
      return <Label bsStyle="default" style={{opacity: 0}}></Label>
    }
  }
}

export default StatusLabel
