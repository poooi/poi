import React, { Component } from 'react'
import { ProgressBar } from 'react-bootstrap'
import { createSelector } from 'reselect'
import { connect } from 'react-redux'
import { get } from 'lodash'

import {
  sortieMapDataSelector,
  sortieMapHpSelector,
  extensionSelectorFactory,
} from 'views/utils/selectors'

const {i18n, toast} = window
const __ = i18n.others.__.bind(i18n.others)

// Map Reminder
export default connect(
  createSelector([
    sortieMapDataSelector,
    sortieMapHpSelector,
    extensionSelectorFactory('poi-plugin-map-hp'),
  ], (mapData, mapHp, pluginMapHpData={}) => ({
    mapId: get(mapData, '0.api_id'),
    rank: get(mapData, '0.api_eventmap.api_selected_rank'),
    mapData,
    mapHp,
    finalHps: pluginMapHpData.finalHps || {},
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
    const {mapHp, mapData} = this.props
    const isFinalAttack = this.isFinalAttack()
    if (isFinalAttack) {
      toast(__('Possible final stage'), {
        type: 'warning',
        title: __('Sortie'),
      })
    }
    const finalText = isFinalAttack ? __('Final') : ''
    return (
      <div>
        {
          !mapHp ? undefined :
            <ProgressBar bsStyle="info" now={mapHp[0]} max={mapHp[1]} />
        }
        <div className='alert alert-default'>
          <span id='map-reminder-area'>
            {this.getMapText(mapData) + finalText}
          </span>
        </div>
      </div>
    )
  }
})
