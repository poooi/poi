import { join } from 'path-extra'
import { connect } from 'react-redux'
import classNames from 'classnames'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Panel, Button, ButtonGroup, Alert } from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import { get, memoize, times } from 'lodash'
import { createSelector } from 'reselect'

const {i18n, dbg, dispatch} = window
const __ = i18n.main.__.bind(i18n.main)

import { ShipRow } from './shipitem'
import { SquardRow } from './lbac-view'
import { LandbaseButton } from '../ship-parts/landbase-button'
import TopAlert from 'views/components/ship-parts/topalert'
import {
  fleetNameSelectorFactory,
  fleetStateSelectorFactory,
  fleetShipsIdSelectorFactory,
} from 'views/utils/selectors'

function getStyle(state, disabled) {
  if (state >= 0 && state <= 5 && !disabled)
    // 0: Cond >= 40, Supplied, Repaired, In port
    // 1: 20 <= Cond < 40, or not supplied, or medium damage
    // 2: Cond < 20, or heavy damage
    // 3: Repairing
    // 4: In mission
    // 5: In map
    return ['success', 'warning', 'danger', 'info', 'primary', 'default'][state]
  else
    return 'default'
}

const defaultFleetNames = ['I', 'II', 'III', 'IV']

const shipViewSwitchButtonDataSelectorFactory = memoize((fleetId) =>
  createSelector([
    fleetNameSelectorFactory(fleetId),
    fleetStateSelectorFactory(fleetId),
  ], (fleetName, fleetState) => ({
    fleetState,
    fleetName,
  }))
)
const ShipViewSwitchButton = connect(
  (state, {fleetId}) =>
    shipViewSwitchButtonDataSelectorFactory(fleetId)(state)
)(({fleetId, activeFleetId, fleetName, fleetState, onClick, disabled}) =>
  <Button
    bsSize="small"
    bsStyle={getStyle(fleetState, disabled)}
    onClick={onClick}
    disabled={disabled}
    className={fleetId == activeFleetId ? 'active' : ''}
  >
    {fleetName || defaultFleetNames[fleetId]}
  </Button>
)


const fleetShipViewDataSelectorFactory = memoize((fleetId) =>
  createSelector([
    fleetShipsIdSelectorFactory(fleetId),
  ], (shipsId) => ({
    shipsId,
  }))
)
const FleetShipView = connect(
  (state, {fleetId}) =>
    fleetShipViewDataSelectorFactory(fleetId)(state)
)(({fleetId, shipsId}) =>
  <div>
    <div className='fleet-name'>
      <TopAlert
        fleetId={fleetId}
        isMini={false}
      />
    </div>
    <div className="ship-details">
    {
      (shipsId || []).map((shipId, i) =>
        <ShipRow
          key={shipId}
          shipId={shipId}
          />
      )
    }
    </div>
  </div>
)

const LBView = connect(state => ({
  areaIds: get(state, 'info.airbase', []).map(a => a.api_area_id),
  mapareas: get(state, 'const.$mapareas', {}),
}))(({areaIds, mapareas}) => (
    <div>
      <div className="ship-details">
      {
        areaIds.map((id, i) => (
          id === areaIds[i - 1] ?
          <SquardRow
            key={i}
            squardId={i}
          /> :
          <div>
            <Alert style={{ color: window.isDarkTheme ? '#FFF' : '#000' }} className='airbase-area'>
              [{id}] {window.i18n.resources.__((mapareas[id] || {}).api_name)}
            </Alert>
            <SquardRow
              key={i}
              squardId={i}
              />
          </div>
        ))
      }
      </div>
    </div>
  )
)


const ShipView = connect((state, props) => ({
  enableTransition: get(state, 'config.poi.transition.enable', true),
  fleetCount: get(state, 'info.fleets.length', 4),
  activeFleetId: get(state, 'ui.activeFleetId', 0),
  airBaseCnt: get(state, 'info.airbase.length', 0),
})
)(class ShipView extends Component {
  static propTypes = {
    enableTransition: PropTypes.bool.isRequired,
    fleetCount: PropTypes.number.isRequired,
    activeFleetId: PropTypes.number.isRequired,
  }

  constructor(props) {
    super(props)
    this.nowTime = 0
  }

  componentWillUpdate(nextProps, nextState) {
    this.nowTime = (new Date()).getTime()
  }
  componentDidUpdate(prevProps, prevState) {
    const cur = Date.now()
    dbg.extra('moduleRenderCost').log(`the cost of ship-module render: ${cur-this.nowTime}ms`)
  }

  handleClick = (idx) => {
    if (idx != this.props.activeFleetId) {
      dispatch({
        type: '@@TabSwitch',
        tabInfo: {
          activeFleetId: idx,
        },
      })
    }
  }

  changeMainView = () => {
    dispatch({
      type: '@@TabSwitch',
      tabInfo: {
        activeMainTab: 'mainView',
      },
    })
  }

  render() {
    return (
      <Panel onDoubleClick={this.changeMainView}>
        <link rel="stylesheet" href={join(__dirname, 'assets', 'ship.css')} />
        <div className="div-row">
          <ButtonGroup className="fleet-name-button">
          {
            times(4).map((i) =>
              <ShipViewSwitchButton
                key={i}
                fleetId={i}
                disabled={i + 1 > this.props.fleetCount}
                onClick={e => this.handleClick(i)}
                activeFleetId={this.props.activeFleetId}
                />
            )
          }
          </ButtonGroup>
          <ButtonGroup className='plane-button'>
            <LandbaseButton key={4}
              fleetId={4}
              disabled={this.props.airBaseCnt === 0}
              onClick={e => this.handleClick(4)}
              activeFleetId={this.props.activeFleetId}
              isMini={false}
              />
          </ButtonGroup>
        </div>
        <div className="no-scroll">
          <div
            className={classNames("ship-tab-content", {'ship-tab-content-transition': this.props.enableTransition})}
            style={{transform: `translateX(-${this.props.activeFleetId}00%)`}}>
          {
            times(4).map((i) =>
              <div className="ship-deck" key={i}>
                <FleetShipView fleetId={i} />
              </div>
            )
          }
          <div className="ship-deck" key={4}>
            <LBView />
          </div>
          </div>
        </div>
      </Panel>
    )
  }
})

export default {
  name: 'ShipView',
  displayName: <span><FontAwesome key={0} name='bars' />{__(' Fleet')}</span>,
  reactClass: ShipView,
}
