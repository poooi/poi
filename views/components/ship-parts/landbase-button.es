import { connect } from 'react-redux'
import React from 'react'
import { Button, Label, Tooltip, OverlayTrigger } from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import { get } from 'lodash'
import { translate, Trans } from 'react-i18next'

import './assets/landbase-button.css'

const fatiguedLabel = <Label bsStyle='danger' className='airbase-state-label'><Trans>main:Fatigued</Trans></Label>
const emptyLabel = <Label bsStyle='warning' className='airbase-state-label'><Trans>main:Empty Slot</Trans></Label>
const relocateLabel = <Label bsStyle='warning' className='airbase-state-label'><Trans>main:Relocating</Trans></Label>
const resupplyLabel = <Label bsStyle='warning' className='airbase-state-label'><Trans>main:Resupply Needed</Trans></Label>
const noActionLabel = <Label bsStyle='warning' className='airbase-state-label'><Trans>main:No Action</Trans></Label>
const readyLabel = <Label bsStyle='success' className='airbase-state-label'><Trans>main:Ready</Trans></Label>

export const LandbaseButton = translate(['resources'])(connect(state => ({
  sortieStatus: get(state, 'sortie.sortieStatus', []),
  airbase: get(state, 'info.airbase', []),
  mapareas: get(state, 'const.$mapareas', {}),
}))(({ fleetId, activeFleetId, onClick, disabled, airbase, sortieStatus, mapareas, isMini, t }) => {
  const airbaseProps = airbase.map(a => a.api_area_id).filter(a => mapareas[a])
    .sort((a, b) => a - b)
    .filter((a, i, arr) => a != arr[i - 1])
    .map(i => ({
      mapId: i,
      needSupply: airbase.filter(a => mapareas[a.api_area_id]).filter(a => a.api_area_id === i)
        .map(a => a.api_plane_info.map(s => s.api_count !== s.api_max_count).reduce((a, b) => a || b, false))
        .reduce((a, b) => a || b, false),
      // 0: 未配属あり, 1: 配属済み, >1: 配置転換中あり
      squardState: airbase.filter(a => mapareas[a.api_area_id]).filter(a => a.api_area_id === i)
        .map(a => a.api_plane_info.map(s => s.api_state).reduce((a, b) => a * b, 1)).reduce((a, b) => a * b, 1),
      // 1: 通常, >1: 黄疲労・赤疲労あり
      squardCond: airbase.filter(a => mapareas[a.api_area_id]).filter(a => a.api_area_id === i)
        .map(a => a.api_plane_info.map(s => s.api_cond || 1).reduce((a, b) => a * b, 1)).reduce((a, b) => a * b, 1),
      noAction: airbase.filter(a => mapareas[a.api_area_id]).filter(a => a.api_area_id === i)
        .map(a => a.api_action_kind !== 1 && a.api_action_kind !== 2).reduce((a, b) => a || b, false),
      allEmpty:  airbase.filter(a => mapareas[a.api_area_id]).filter(a => a.api_area_id === i)
        .map(a => a.api_plane_info.map(s => s.api_state === 0).reduce((a, b) => a && b, true)).reduce((a, b) => a && b, true),
    }))
  const needSupply = airbaseProps.filter(a => !a.allEmpty).map(a => a.needSupply).reduce((a, b) => a || b, false)
  const squardState = airbaseProps.filter(a => !a.allEmpty).map(a => a.squardState).reduce((a, b) => a * b, 1)
  const squardCond = airbaseProps.filter(a => !a.allEmpty).map(a => a.squardCond).reduce((a, b) => a * b, 1)
  const noAction = airbaseProps.filter(a => !a.allEmpty).map(a => a.noAction).reduce((a, b) => a || b, false)
  const sortie = sortieStatus.filter(a => !a.allEmpty).reduce((a, b) => a || b, false)
  const bsStyle = (() => {
    if (sortie) {
      return 'default'
    } else if (squardCond > 1) {
      return 'danger'
    } else if (squardState !== 1 || needSupply) {
      return 'warning'
    } else if (noAction) {
      return 'info'
    } else {
      return 'success'
    }
  })()
  const propTooltip = <Tooltip id={isMini ? 'airbase-tooltip-mini' : 'airbase-tooltip'}>
    {
      airbaseProps.map((airbase, i) => {
        const { mapId, needSupply, squardState, squardCond, noAction } = airbase
        return (
          <div key={i}>
            <div>[{mapId}] {mapareas[mapId] ? t(`resources:${ mapareas[mapId].api_name }`) : ''}</div>
            { squardCond > 1 && fatiguedLabel }
            { squardState < 1 && emptyLabel }
            { squardState > 1 && relocateLabel }
            { needSupply && resupplyLabel }
            { noAction && noActionLabel }
            {
              squardCond === 1 &&
              squardState === 1 &&
              !needSupply &&
              !noAction &&
              readyLabel
            }
          </div>
        )
      })
    }
  </Tooltip>
  return (
    <OverlayTrigger placement='bottom' overlay={propTooltip}>
      <Button
        bsSize={isMini ? 'xsmall' : 'small'}
        bsStyle={bsStyle}
        onClick={onClick}
        disabled={disabled}
        className={fleetId == activeFleetId ? 'active' : ''}
      >
        <FontAwesome name='plane' />
      </Button>
    </OverlayTrigger>
  )
}))
