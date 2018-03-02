import { connect } from 'react-redux'
import classNames from 'classnames'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Panel, Button, ButtonGroup } from 'react-bootstrap'
import { get, memoize } from 'lodash'
import { createSelector } from 'reselect'

const { dispatch } = window

import { PaneBodyMini, LBViewMini } from './minishippane'
import { LandbaseButton } from '../../ship-parts/landbase-button'
import { fleetStateSelectorFactory } from 'views/utils/selectors'
import { layoutResizeObserver } from 'views/services/layout'

import '../assets/miniship.css'

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


const fleetNames = ['I', 'II', 'III', 'IV']

const shipViewSwitchButtonDataSelectorFactory = memoize((fleetId) =>
  createSelector([
    fleetStateSelectorFactory(fleetId),
  ], (fleetState) => ({
    fleetState,
  }))
)

const ShipViewSwitchButton = connect(
  (state, {fleetId}) =>
    shipViewSwitchButtonDataSelectorFactory(fleetId)(state)
)(({fleetId, activeFleetId, fleetState, onClick, disabled}) =>
  <Button
    bsSize="xsmall"
    bsStyle={getStyle(fleetState, disabled)}
    onClick={onClick}
    disabled={disabled}
    className={fleetId == activeFleetId ? 'active' : ''}
  >
    {fleetNames[fleetId]}
  </Button>
)

@connect((state, props) => ({
  airBaseCnt: get(state, 'info.airbase.length', 0),
  enableTransition: get(state, 'config.poi.transition.enable', true),
  fleetCount: get(state, 'info.fleets.length', 4),
  activeFleetId: get(state, 'ui.activeFleetId', 0),
}))
export class MiniShip extends Component {
  static propTypes = {
    airBaseCnt: PropTypes.number.isRequired,
    enableTransition: PropTypes.bool.isRequired,
    fleetCount: PropTypes.number.isRequired,
    activeFleetId: PropTypes.number.isRequired,
  }

  constructor(props) {
    super(props)
    this.nowTime = 0
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

  changeShipView = () => {
    dispatch({
      type: '@@TabSwitch',
      tabInfo: {
        activeMainTab: 'shipView',
      },
    })
  }

  componentWillUnmount() {
    layoutResizeObserver.unobserve(this.minishippane)
  }

  componentDidMount() {
    layoutResizeObserver.observe(this.minishippane)
  }

  render() {
    return (
      <div style={{height: '100%'}} onDoubleClick={this.changeShipView}>
        <Panel id="ShipViewMini" className="ship-view-mini" bsStyle="default">
          <Panel.Body>
            <div className="panel-row miniship-fleet-btn">
              <ButtonGroup bsSize="xsmall">
                {
                  [0, 1, 2, 3].map((i) =>
                    <ShipViewSwitchButton
                      key={i}
                      fleetId={i}
                      disabled={i + 1 > this.props.fleetCount}
                      onClick={this.handleClick.bind(this, i)}
                      activeFleetId={this.props.activeFleetId}
                    />
                  )
                }
              </ButtonGroup>
              <ButtonGroup bsSize="xsmall" className='plane-button-mini'>
                <LandbaseButton key={4}
                  fleetId={4}
                  disabled={this.props.airBaseCnt === 0}
                  onClick={e => this.handleClick(4)}
                  activeFleetId={this.props.activeFleetId}
                  isMini={true}
                />
              </ButtonGroup>
            </div>
            <div className="no-scroll miniship-fleet-content" ref={ref => { this.minishippane = ref }}>
              <div className={classNames("ship-tab-content", {'ship-tab-content-transition': this.props.enableTransition})}
                style={{transform: `translateX(-${this.props.activeFleetId}00%)`}}>
                {
                  [0, 1, 2, 3].map((i) => (
                    <div className="ship-deck ship-tabpane" key={i}>
                      <PaneBodyMini
                        key={i}
                        fleetId={i}
                      />
                    </div>
                  ))
                }
                <div className="ship-deck ship-tabpane ship-lbac" key={4}>
                  <LBViewMini />
                </div>
              </div>
            </div>
          </Panel.Body>
        </Panel>
      </div>
    )
  }
}
