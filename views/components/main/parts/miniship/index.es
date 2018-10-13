import { connect } from 'react-redux'
import classNames from 'classnames'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { get, memoize } from 'lodash'
import { createSelector } from 'reselect'
import { Card, ButtonGroup, Button } from '@blueprintjs/core'

import { PaneBodyMini, LBViewMini } from './minishippane'
import { LandbaseButton } from '../../../ship-parts/landbase-button'
import { fleetStateSelectorFactory } from 'views/utils/selectors'
import { layoutResizeObserver } from 'views/services/layout'
import { getFleetIntent, DEFAULT_FLEET_NAMES } from 'views/utils/game-utils'

import '../../assets/miniship.css'

const shipViewSwitchButtonDataSelectorFactory = memoize(fleetId =>
  createSelector([fleetStateSelectorFactory(fleetId)], fleetState => ({
    fleetState,
  })),
)

const ShipViewSwitchButton = connect((state, { fleetId }) =>
  shipViewSwitchButtonDataSelectorFactory(fleetId)(state),
)(({ fleetId, activeFleetId, fleetState, onClick, disabled }) => (
  <Button
    intent={getFleetIntent(fleetState, disabled)}
    onClick={onClick}
    disabled={disabled}
    className={fleetId == activeFleetId ? 'active' : ''}
  >
    {DEFAULT_FLEET_NAMES[fleetId]}
  </Button>
))

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
    dispatch: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)
    this.nowTime = 0
  }

  handleClick = idx => {
    if (idx != this.props.activeFleetId) {
      this.props.dispatch({
        type: '@@TabSwitch',
        tabInfo: {
          activeFleetId: idx,
        },
      })
    }
  }

  handleChangeShipView = () => {
    this.props.dispatch({
      type: '@@TabSwitch',
      tabInfo: {
        activeMainTab: 'ship-view',
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
      <Card onDoubleClick={this.handleChangeShipView}>
        <div className="panel-row miniship-switch">
          <ButtonGroup className="miniship-fleet-switch">
            {[0, 1, 2, 3].map(i => (
              <ShipViewSwitchButton
                key={i}
                fleetId={i}
                disabled={i + 1 > this.props.fleetCount}
                onClick={this.handleClick.bind(this, i)}
                activeFleetId={this.props.activeFleetId}
              />
            ))}
          </ButtonGroup>
          <LandbaseButton
            key={4}
            fleetId={4}
            disabled={this.props.airBaseCnt === 0}
            onClick={e => this.handleClick(4)}
            activeFleetId={this.props.activeFleetId}
            isMini={true}
          />
        </div>
        <div
          className="no-scroll miniship-fleet-content"
          ref={ref => {
            this.minishippane = ref
          }}
        >
          <div
            className={classNames('ship-tab-content', {
              'ship-tab-content-transition': this.props.enableTransition,
            })}
            style={{ transform: `translateX(-${this.props.activeFleetId}00%)` }}
          >
            {[0, 1, 2, 3].map(i => (
              <div className="ship-deck ship-tabpane" key={i}>
                <PaneBodyMini key={i} fleetId={i} />
              </div>
            ))}
            <div className="ship-deck ship-tabpane ship-lbac" key={4}>
              <LBViewMini />
            </div>
          </div>
        </div>
      </Card>
    )
  }
}
