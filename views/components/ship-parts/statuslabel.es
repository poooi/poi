import React from 'react'
import FontAwesome from 'react-fontawesome'
import { OverlayTrigger, Tooltip, Label } from 'react-bootstrap'
import { connect } from 'react-redux'
import { isEqual, get } from 'lodash'
import { translate } from 'react-i18next'

const texts = [
  ['Retreated'],
  ['Repairing'],
  ['Resupply Needed'],
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

@translate(['main'])
@connect(state => ({
  shipTag: state.fcd.shiptag || initState,
}))
export class StatusLabel extends React.Component {
  shouldComponentUpdate = (nextProps, nextState) => (
    nextProps.label !== this.props.label || !isEqual(this.props.shipTag, nextProps.shipTag)
  )
  render() {
    const { label: i, t} = this.props
    const {color, mapname, fleetname} = this.props.shipTag
    const { language } = window
    if (i != null && 0 <= i) {
      return (
        <OverlayTrigger placement="top" overlay={
          <Tooltip id={`statuslabel-status-${i}`}>
            {
              i > 2
                ? `${ get(fleetname, [language, i - 3], t('main:Ship tag')) } - ${mapname[i - 3] || i - 2}`
                : t(`main:${ texts[i] }`)
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
