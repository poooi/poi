import { connect } from 'react-redux'
import React from 'react'
import { Button } from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import { get } from 'lodash'

export const LandbaseButton = connect(state => ({
  sortieStatus: get(state, 'sortie.sortieStatus', []),
  airbase: get(state, 'info.airbase', []),
}))(({ fleetId, activeFleetId, onClick, disabled, airbase, sortieStatus, isMini }) => {
  const needSupply = airbase.map(a => a.api_plane_info.map(s => s.api_count !== s.api_max_count).reduce((a, b) => a || b)).reduce((a, b) => a || b)
  const squardState = airbase.map(a => a.api_plane_info.map(s => s.api_state).reduce((a, b) => a * b)).reduce((a, b) => a * b)
  const squardCond = airbase.map(a => a.api_plane_info.map(s => s.api_cond || 1).reduce((a, b) => a * b)).reduce((a, b) => a * b)
  const sortie = sortieStatus.reduce((a, b) => a || b)
  const bsStyle = (() => {
    if (sortie) {
      return 'default'
    } else if (squardCond > 1) {
      return 'danger'
    } else if (squardState !== 1 || needSupply) {
      return 'warning'
    } else {
      return 'success'
    }
  })()
  return (
    <Button
      bsSize={isMini ? 'xsmall' : 'small'}
      bsStyle={bsStyle}
      onClick={onClick}
      disabled={disabled}
      className={fleetId == activeFleetId ? 'active' : ''}
    >
      <FontAwesome name='plane' />
    </Button>
  )
})
