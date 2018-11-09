/* global language */
import React from 'react'
import FontAwesome from 'react-fontawesome'
import { connect } from 'react-redux'
import { isEqual, get } from 'lodash'
import { translate } from 'react-i18next'
import { Tooltip, Tag, Intent, Position } from '@blueprintjs/core'

const TEXTS = [['Retreated'], ['Repairing'], ['Resupply Needed']]
const INTENTS = [Intent.WARNING, Intent.NONE, Intent.WARNING]
const ICONS = ['reply', 'wrench', 'database']

const initState = {
  color: [],
  mapname: [],
}

@translate(['main'])
@connect(state => ({
  shipTag: state.fcd.shiptag || initState,
}))
export class StatusLabel extends React.Component {
  shouldComponentUpdate = (nextProps, nextState) =>
    nextProps.label !== this.props.label || !isEqual(this.props.shipTag, nextProps.shipTag)
  render() {
    const { label: i, t } = this.props
    const { color, mapname, fleetname } = this.props.shipTag
    if (i != null && 0 <= i) {
      return (
        <Tooltip
          position={Position.TOP}
          content={
            i > 2
              ? `${get(fleetname, [language, i - 3], t('main:Ship tag'))} - ${mapname[i - 3] ||
                  i - 2}`
              : t(`main:${TEXTS[i]}`)
          }
        >
          <Tag
            minimal
            intent={INTENTS[i] || Intent.NONE}
            style={i > 2 ? { color: color[i - 3] || '' } : {}}
          >
            <FontAwesome key={0} name={ICONS[i] || 'tag'} />
          </Tag>
        </Tooltip>
      )
    } else {
      return <Tag minimal intent={Intent.NONE} style={{ opacity: 0 }} />
    }
  }
}
