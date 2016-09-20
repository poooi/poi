import React, { Component } from 'react'
import { ProgressBar, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { createSelector } from 'reselect'
import { connect } from 'react-redux'
import { get } from 'lodash'

import {
  sortieMapDataSelector,
  sortieMapHpSelector,
  extensionSelectorFactory,
  currentNodeSelector,
} from 'views/utils/selectors'

const {i18n, toast} = window
const __ = i18n.others.__.bind(i18n.others)
const emptyFinalHps = {}

// Map Reminder
export default connect(
  createSelector([
    sortieMapDataSelector,
    sortieMapHpSelector,
    currentNodeSelector,
    extensionSelectorFactory('poi-plugin-map-hp'),
  ], (mapData, mapHp, currentNode, pluginMapHpData={}) => ({
    mapId: get(mapData, '0.api_id'),
    rank: get(mapData, '0.api_eventmap.api_selected_rank'),
    currentNode,
    mapData,
    mapHp,
    finalHps: pluginMapHpData.finalHps || emptyFinalHps,
  }))
)(class MapReminder extends Component {
  static mapRanks = ['', ` ${__('丙')}`, ` ${__('乙')}`, ` ${__('甲')}`]

  getMapText(mapData) {
    if (!mapData)
      return __('Not in sortie')
    const {rank} = this.props
    const {api_maparea_id, api_no} = mapData[1]

    const mapName = `${api_maparea_id}-${api_no}` +
      (rank == null ? '' : this.constructor.mapRanks[rank])
    return `${__('Sortie area')}: ${mapName}`
  }

  isFinalAttack() {
    const {mapHp, rank, mapId} = this.props
    if (!mapHp || mapHp[0] == 0)
      return false
    const finalHpPostfix = ['', '丙', '乙', '甲'][rank] || ''
    const finalHp = this.props.finalHps[`${mapId}${finalHpPostfix}`] || 0
    return finalHp >= mapHp[0]
  }

  render() {
    const {mapHp, mapData, currentNode} = this.props
    const isFinalAttack = this.isFinalAttack()
    if (isFinalAttack) {
      toast(__('Possible final stage'), {
        type: 'warning',
        title: __('Sortie'),
      })
    }
    const tooltipMsg = []
    if (currentNode) {
      tooltipMsg.push(`${__('Node')}: ${currentNode}`)
    }
    if (mapHp && mapHp[1] > 0 && mapHp[0] !== 0) {
      tooltipMsg.push(`${mapHp[0]} / ${mapHp[1]}`)
    }
    return (
      <OverlayTrigger
        placement='top'
        overlay={
          <Tooltip id='detail-map-info' style={tooltipMsg.length === 0 ? {display: 'none'}: {}}>
            {tooltipMsg.join(' | ')}
          </Tooltip>
        }>
        <div>
          {
            !mapHp ? undefined :
              <ProgressBar bsStyle="info" now={mapHp[0]} max={mapHp[1]} />
          }
          <div className='alert alert-default'>
            <span id='map-reminder-area'>
              {this.getMapText(mapData)}
            </span>
          </div>
        </div>
      </OverlayTrigger>
    )
  }
})
