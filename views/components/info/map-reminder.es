import React, { Component } from 'react'
import { ProgressBar, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { createSelector } from 'reselect'
import { connect } from 'react-redux'
import { get, map, zip, each } from 'lodash'
import { translate } from 'react-i18next'

import { MaterialIcon } from 'views/components/etc/icon'
import {
  sortieMapDataSelector,
  sortieMapHpSelector,
  fcdSelector,
  currentNodeSelector,
} from 'views/utils/selectors'

import './assets/map-reminder.css'

const { toast, config } = window
const emptyObj = {}

const MapRoutes = connect(
  (state) => ({
    sortieMapId: get(state, 'sortie.sortieMapId'),
    spotHistory: get(state, 'sortie.spotHistory'),
    bossSpot: get(state, 'sortie.bossSpot'),
    allMaps: get(state, 'fcd.map'),
  })
)(({sortieMapId, spotHistory, bossSpot, allMaps}) => {
  if (!sortieMapId || !allMaps)
    return <div />
  const mapspots = get(allMaps, `${Math.floor(sortieMapId / 10)}-${sortieMapId % 10}.spots`, {})
  if (!mapspots || !Object.keys(mapspots).length)
    return <div />
  const maproutes = get(allMaps, `${Math.floor(sortieMapId / 10)}-${sortieMapId % 10}.route`, {})
  const histLen = spotHistory.length
  const activeSpot = spotHistory[histLen - 1]
  const bossSpotLoc = mapspots[get(maproutes, `${bossSpot}.1`)] || [-100, -100]
  const locHistory = spotHistory.map(i => mapspots[get(maproutes, `${i}.1`)] || [-1, -1])
  const lineHistory = histLen ? zip(locHistory.slice(0, histLen-1), locHistory.slice(1)) : [[-1, -1], [-1, -1]]
  const SCALE = 1 / 6
  return (
    <div>
      <svg width="190" height="110" viewBox="0 0 190 110" className="maproutes">
        {// Draw all lines
          map(maproutes, ([beg, end], i) => {
            if (!(mapspots[beg] && mapspots[end])) return null
            const [begX, begY] = mapspots[beg]
            const [endX, endY] = mapspots[end]
            return <line key={i} x1={parseInt(begX * SCALE)} y1={parseInt(begY * SCALE)} x2={parseInt(endX * SCALE)} y2={parseInt(endY * SCALE)} />
          })}
        {// Draw passed lines
          lineHistory.map(([[begX, begY], [endX, endY]], i) =>
            begX > 0 && endX > 0 ? <line key={i} x1={parseInt(begX * SCALE)} y1={parseInt(begY * SCALE)} x2={parseInt(endX * SCALE)} y2={parseInt(endY * SCALE)} className="passed" /> : <span />
          )}
        <rect x={parseInt(bossSpotLoc[0] * SCALE) - 4.5} y={parseInt(bossSpotLoc[1] * SCALE) - 4.5} width={9} height={9}
          className='boss' />
        {// Draw all points
          map(mapspots, ([x, y], id) =>
            <rect key={id} x={parseInt(x * SCALE) - 3} y={parseInt(y * SCALE) - 3} width={6} height={6} />
          )}
        {// Draw passed points again, highlighting the active one
          map(zip(spotHistory, locHistory), ([id, [x, y]]) =>
            x > 0 ? <rect key={id} x={parseInt(x * SCALE) - 3} y={parseInt(y * SCALE) - 3} width={6} height={6}
              className={id == activeSpot ? 'active' : 'passed'} /> : <span />
          )}
      </svg>
    </div>
  )
})

const ItemStat = translate()(connect(
  (state) => ({
    itemHistoty: get(state, 'sortie.itemHistory'),
  })
)(({ itemHistoty, t }) => {
  const stat = {}
  each(itemHistoty, (item = {}) => {
    each(Object.keys(item), itemKey =>
      stat[itemKey] = item[itemKey] + (stat[itemKey] || 0)
    )
  })
  return (
    <div>
      {Object.keys(stat).length > 0 && `${t('Resources')}: `}
      {
        map(Object.keys(stat), itemKey => (
          itemKey &&
          <span key={itemKey} className="item-stat">
            <MaterialIcon materialId={parseInt(itemKey)} className="material-icon reminder"/>
            {stat[itemKey] > 0 ? `+${stat[itemKey]}` : String(stat[itemKey])}
          </span>
        )
        )
      }
    </div>
  )
}))

// Map Reminder
@translate()
@connect(createSelector([
  sortieMapDataSelector,
  sortieMapHpSelector,
  currentNodeSelector,
  fcdSelector,
], (mapData, mapHp, currentNode, fcd={}) => ({
  mapId: get(mapData, '0.api_id'),
  rank: get(mapData, '0.api_eventmap.api_selected_rank'),
  currentNode,
  mapData,
  mapHp,
  finalHps: fcd.maphp || emptyObj,
  maps: fcd.map || emptyObj,
})))
export class PoiMapReminder extends Component {
  getMapText(mapData, mapRanks) {
    if (!mapData)
      return this.props.t('Not in sortie')
    const {rank} = this.props
    const {api_maparea_id, api_no} = mapData[1]

    const mapName = `${api_maparea_id}-${api_no}` +
      (rank == null ? '' : mapRanks[rank])
    return <>{this.props.t('Sortie area')}: {mapName}</>
  }

  isFinalAttack = () => {
    const {mapHp, rank, mapId} = this.props
    if (!mapHp || mapHp[0] == 0)
      return false
    const finalHpPostfix = ['', '丁', '丙', '乙', '甲'][rank] || ''
    const finalHp = this.props.finalHps[`${mapId}${finalHpPostfix}`] || 0
    return finalHp >= mapHp[0]
  }

  notifyFinalAttack = (e) => {
    if (e.detail.path === '/kcsapi/api_req_map/start') {
      const isFinalAttack = this.isFinalAttack()
      if (isFinalAttack && config.get("poi.lastbattle.enabled", true)) {
        toast(this.props.t('Possible final stage'), {
          type: 'warning',
          title: this.props.t('Sortie'),
        })
      }
    }
  }

  componentDidMount() {
    window.addEventListener('game.response', this.notifyFinalAttack)
  }

  componentWillUnmount() {
    window.removeEventListener('game.response', this.notifyFinalAttack)
  }

  render() {
    const { mapHp, mapData, currentNode, mapId, maps, t } = this.props
    const tooltipMsg = []
    const alphaNode = get(maps, `${Math.floor(mapId / 10)}-${mapId % 10}.route.${currentNode}.1`) || '?'
    if (currentNode) {
      tooltipMsg.push(<span className='map-tooltip-msg' key='node'>{t('Node')}: {alphaNode} ({currentNode})</span>)
    }
    if (mapHp && mapHp[1] > 0 && mapHp[0] !== 0) {
      tooltipMsg.push(<span className='map-tooltip-msg' key='hp'>HP: {mapHp[0]} / {mapHp[1]}</span>)
    }
    return (
      <OverlayTrigger
        placement='top'
        overlay={
          <Tooltip id='detail-map-info' className="reminder-pop" style={tooltipMsg.length === 0 ? {display: 'none'}: {}}>
            <MapRoutes />
            <div>{ tooltipMsg }</div>
            <ItemStat />
          </Tooltip>
        }>
        <div>
          {
            !mapHp ? undefined :
              <ProgressBar bsStyle="info" now={mapHp[0]} max={mapHp[1]} />
          }
          <div className='alert alert-default'>
            <span id='map-reminder-area'>
              {this.getMapText(mapData, ['', this.props.t('丁'), this.props.t('丙'), this.props.t('乙'), this.props.t('甲')])}
            </span>
          </div>
        </div>
      </OverlayTrigger>
    )
  }
}
