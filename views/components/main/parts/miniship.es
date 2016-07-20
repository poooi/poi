import { join } from 'path-extra'
import { connect } from 'react-redux'
import classNames from 'classnames'
import React, { PropTypes } from 'react'
import { Panel, Button, ButtonGroup } from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import { get } from 'lodash'

const {dbg, i18n} = window
const __ = i18n.main.__.bind(i18n.main)
const { Component } = React

const confGet = (target, path, value) =>
  ((typeof get(target, path) === "undefined") ? value : get(target, path))

import {PaneBodyMini} from './minishippane'

function getStyle(state) {
  if (state >= 0 && state <= 5)
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

function getDeckState(shipsData, inBattle, inExpedition, inRepairShipsId) {
  let state = 0
  if (inBattle)
    state = Math.max(state, 5)
  if (inExpedition)
    state = Math.max(state, 4)
  for (const [ship, $ship] of shipsData) {
    if (!ship || !$ship)
      continue
    // Cond < 20 or medium damage
    if (ship.api_cond < 20 || ship.api_nowhp / ship.api_maxhp < 0.25)
      state = Math.max(state, 2)
    // Cond < 40 or heavy damage
    else if (ship.api_cond < 40 || ship.api_nowhp / ship.api_maxhp < 0.5)
      state = Math.max(state, 1)
    // Not supplied
    if (ship.api_fuel / $ship.api_fuel_max < 0.99 || ship.api_bull / $ship.api_bull_max < 0.99)
      state = Math.max(state, 1)
    // Repairing
    if (inRepairShipsId.indexOf(ship.api_id) != -1)
      state = Math.max(state, 3)
  }
  return state
}

const fleetNames = [`${__('I')}`, `${__('II')}`, `${__('III')}`, `${__('IV')}`]

const ShipViewSwitchButton = connect(() => {
  const {makeThisFleetShipsDataSelector, makeThisFleetSelector, sortieStatusSelector, inRepairShipsIdSelector} = window
  const thisFleetShipsDataSelector = makeThisFleetShipsDataSelector()
  const thisFleetSelector = makeThisFleetSelector()
  return (state, props) => {
    const fleet = thisFleetSelector(state, props)
    const inExpedition = fleet ? fleet.api_mission[0] : false
    const inBattle = sortieStatusSelector(state)[props.fleetId]
    const inRepairShipsId = inRepairShipsIdSelector(state)
    const shipsData = thisFleetShipsDataSelector(state, props) || []
    const fleetState = getDeckState(shipsData, inBattle, inExpedition, inRepairShipsId)
    return {
      fleetState,
      fleetName: fleet ? fleet.api_name : '',
    }
  }
}
)(({fleetId, activeFleetId, fleetName, fleetState, onClick}) =>
  <Button
    bsSize="xsmall"
    bsStyle={getStyle(fleetState)}
    onClick={onClick}
    className={fleetId == activeFleetId ? 'active' : ''}
  >
    {fleetNames[fleetId]}
  </Button>
)

export default connect((state, props) => ({
    // TODO: Move config into redux
  enableTransition: confGet(state, 'config.poi.transition.enable', true),
})
)(class MiniShip extends Component {
  static propTypes = {
    enableTransition: PropTypes.bool.isRequired,
    activeFleetId: PropTypes.number.isRequired,
  }

  static contextTypes = {
    selectTab: PropTypes.func.isRequired,
    selectFleet: PropTypes.func.isRequired,
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
      this.context.selectFleet(idx)
    }
  }

  changeShipView = () => {
    this.context.selectTab('shipView')
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
                  onClick={this.handleClick.bind(this, i)}
                  activeFleetId={this.props.activeFleetId}
                  />
              )
            }
            </ButtonGroup>
          </div>
          <div className="no-scroll">
            <div className={classNames("ship-tab-content", {'ship-tab-content-transition': this.props.enableTransition})}
                 style={{left: `-${this.props.activeFleetId}00%`}}>
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
