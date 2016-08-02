import React, { Component } from 'react'
import { ProgressBar } from 'react-bootstrap'
import { createSelector } from 'reselect'
import { connect } from 'react-redux'

import {
  sortieMapDataSelector,
  sortieMapHpSelector,
} from 'views/utils/selectors'

const __ = window.i18n.others.__.bind(window.i18n.others)

// Map Reminder
export default connect(
  createSelector([
    sortieMapDataSelector,
    sortieMapHpSelector,
  ], (mapData, mapHp) => ({
    inSortieMapData: mapData,
    inSortieMapHp: mapHp,
  }))
)(class MapReminder extends Component {
  static mapRanks = ['', ` ${__('丙')}`, ` ${__('乙')}`, ` ${__('甲')}`]
  getMapText(mapData) {
    if (!mapData)
      return __('Not in sortie')
    const {api_eventmap} = mapData[0]
    const {api_maparea_id, api_no} = mapData[1]
    const rank = api_eventmap ? api_eventmap.api_selected_rank : null
    const mapName = `${api_maparea_id}-${api_no}` +
      (rank == null ? '' : this.mapRanks[rank])
    return `${__('Sortie area')}: ${mapName}`
  }
  render() {
    const {inSortieMapHp: mapHp, inSortieMapData: mapData} = this.props
    return (
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
    )
  }
})
