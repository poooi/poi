import { join } from 'path-extra'
import { connect } from 'react-redux'
import classNames from 'classnames'
import React, { PropTypes } from 'react'
import { Panel, Button, ButtonGroup } from 'react-bootstrap'
import { get, memoize } from 'lodash'
import { createSelector } from 'reselect'

const { dbg, i18n, dispatch } = window
const __ = i18n.main.__.bind(i18n.main)
const { Component } = React

import { PaneBodyMini } from './minishippane'
import { fleetStateSelectorFactory } from 'views/utils/selectors'

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


const fleetNames = [`${__('I')}`, `${__('II')}`, `${__('III')}`, `${__('IV')}`]

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

export default connect((state, props) => ({
  enableTransition: get(state, 'config.poi.transition.enable', true),
  fleetCount: get(state, 'info.fleets.length', 4),
  activeFleetId: get(state, 'ui.activeFleetId', 0),
})
)(class MiniShip extends Component {
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
    dbg.extra('moduleRenderCost').log(`the cost of mini-ship-module render: ${cur-this.nowTime}ms`)
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

  render() {
    return (
      <div style={{height: '100%'}} onDoubleClick={this.changeShipView}>
        <Panel id="ShipViewMini" bsStyle="default" style={{minHeight: 322, height: 'calc(100% - 6px)'}}>
          <link rel="stylesheet" href={join(__dirname, '..', 'assets', 'miniship.css')} />
          <div className="panel-row">
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
          </div>
          <div className="no-scroll">
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
            </div>
          </div>
        </Panel>
      </div>
    )
  }
})
