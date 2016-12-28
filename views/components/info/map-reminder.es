import React, { Component } from 'react'
import { ProgressBar, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { createSelector } from 'reselect'
import { connect } from 'react-redux'
import { get, map, zip } from 'lodash'

import {
  sortieMapDataSelector,
  sortieMapHpSelector,
  fcdSelector,
  currentNodeSelector,
} from 'views/utils/selectors'

const {i18n, toast} = window
const __ = i18n.others.__.bind(i18n.others)
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
  return (
    <div>
      <svg width="150" height="80" viewBox="0 0 150 80" className="maproutes">
        {// Draw all lines
        map(maproutes, ([beg, end], i) => {
          if (!(mapspots[beg] && mapspots[end])) return null
          const [begX, begY] = mapspots[beg]
          const [endX, endY] = mapspots[end]
          return <line key={i} x1={parseInt(begX / 100)} y1={parseInt(begY / 100)} x2={parseInt(endX / 100)} y2={parseInt(endY / 100)} />
        })}
        {// Draw passed lines
        lineHistory.map(([[begX, begY], [endX, endY]], i) =>
          begX > 0 && endX > 0 ? <line key={i} x1={parseInt(begX / 100)} y1={parseInt(begY / 100)} x2={parseInt(endX / 100)} y2={parseInt(endY / 100)} className="passed" /> : <noscript />
        )}
        <rect x={parseInt(bossSpotLoc[0] / 100) - 3} y={parseInt(bossSpotLoc[1] / 100) - 3} width={6} height={6}
          className='boss' />
        {// Draw all points
        map(mapspots, ([x, y], id) =>
          <rect key={id} x={parseInt(x / 100) - 2} y={parseInt(y / 100) - 2} width={4} height={4} />
        )}
        {// Draw passed points again, highlighting the active one
        map(zip(spotHistory, locHistory), ([id, [x, y]]) =>
          x > 0 ? <rect key={id} x={parseInt(x / 100) - 2} y={parseInt(y / 100) - 2} width={4} height={4}
            className={id == activeSpot ? 'active' : 'passed'} /> : <noscript />
        )}
      </svg>
    </div>
  )
})


// Map Reminder
export default connect(
  createSelector([
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

  isFinalAttack = () => {
    const {mapHp, rank, mapId} = this.props
    if (!mapHp || mapHp[0] == 0)
      return false
    const finalHpPostfix = ['', '丙', '乙', '甲'][rank] || ''
    const finalHp = this.props.finalHps[`${mapId}${finalHpPostfix}`] || 0
    return finalHp >= mapHp[0]
  }

  notifyFinalAttack = (e) => {
    if (e.detail.path === '/kcsapi/api_req_map/start') {
      const isFinalAttack = this.isFinalAttack()
      if (isFinalAttack) {
        toast(__('Possible final stage'), {
          type: 'warning',
          title: __('Sortie'),
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
    const {mapHp, mapData, currentNode, mapId, maps} = this.props
    const tooltipMsg = []
    const alphaNode = get(maps, `${Math.floor(mapId / 10)}-${mapId % 10}.route.${currentNode}.1`) || '?'
    if (currentNode) {
      tooltipMsg.push(`${__('Node')}: ${alphaNode} (${currentNode})`)
    }
    if (mapHp && mapHp[1] > 0 && mapHp[0] !== 0) {
      tooltipMsg.push(`HP: ${mapHp[0]} / ${mapHp[1]}`)
    }
    return (
      <OverlayTrigger
        placement='top'
        overlay={
          <Tooltip id='detail-map-info' style={tooltipMsg.length === 0 ? {display: 'none'}: {}}>
            <MapRoutes />
            {tooltipMsg.join('  |  ')}
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
