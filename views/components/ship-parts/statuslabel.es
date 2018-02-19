import React from 'react'
import FontAwesome from 'react-fontawesome'
import { OverlayTrigger, Tooltip, Label } from 'react-bootstrap'
import { connect } from 'react-redux'
import { isEqual, get } from 'lodash'
import { Trans } from 'react-i18next'

const texts = [
  ['Retreated'],
  ['Repairing'],
  ['Resupply needed'],
]
const styles = [
  'warning',
  'info',
  'warning',
]
const icons = [
  'reply',
  'wrench',
  'database',
]

const initState = {
  color: [],
  mapname: [],
}

@connect(state => ({
  shipTag: state.fcd.shiptag || initState,
}))
export class StatusLabel extends React.Component {
  shouldComponentUpdate = (nextProps, nextState) => (
    nextProps.label !== this.props.label || !isEqual(this.props.shipTag, nextProps.shipTag)
  )
  render() {
    const i = this.props.label
    const {color, mapname, fleetname} = this.props.shipTag
    const { language } = window
    if (i != null && 0 <= i) {
      return (
        <OverlayTrigger placement="top" overlay={
          <Tooltip id={`statuslabel-status-${i}`}>
            {
              i > 2
                ? <>{ get(fleetname, [language, i - 3], <Trans>main:Ship tag</Trans>) } - {mapname[i - 3] || i - 2}</>
                : <Trans>main:{ texts[i] }</Trans>
            }
          </Tooltip>
        }>
          <Label
            bsStyle={styles[i] || 'default'}
            style={i > 2 ? {color: color[i - 3] || '' } : {} }
          >
            <FontAwesome key={0} name={icons[i] || 'tag'} />
          </Label>
        </OverlayTrigger>
      )
    } else {
      return <Label bsStyle="default" style={{opacity: 0}}></Label>
    }
  }
}
