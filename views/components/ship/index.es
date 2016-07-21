import { join } from 'path-extra'
import { connect } from 'react-redux'
import classNames from 'classnames'
import React, { Component, PropTypes } from 'react'
import { Panel, Button, ButtonGroup } from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import { get } from 'lodash'

const confGet = (target, path, value) =>
  ((typeof get(target, path) === "undefined") ? value : get(target, path))

const {i18n, dbg} = window
const __ = i18n.main.__.bind(i18n.main)

import { ShipRow } from './shipitem'
import TopAlert from 'views/components/ship-parts/topalert'

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
    bsSize="small"
    bsStyle={getStyle(fleetState)}
    onClick={onClick}
    className={fleetId == activeFleetId ? 'active' : ''}
  >
    {fleetName}
  </Button>
)


const FleetShipView = connect(() => {
  const {makeThisFleetShipsIdSelector} = window
  const thisFleetShipIdSelector = makeThisFleetShipsIdSelector()
  return (state, props) => ({
    shipsId: thisFleetShipIdSelector(state, props),
  })
}
)(({fleetId, shipsId}) =>
  <div>
    <div className='fleet-name'>
      <TopAlert
        fleetId={fleetId}
        isMini={false}
      />
    </div>
    <div className={"ship-details"}>
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


const ShipView = connect((state, props) => ({
  enableTransition: confGet(state, 'config.poi.transition.enable', true),
})
)(class ShipView extends Component {
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
    dbg.extra('moduleRenderCost').log(`the cost of ship-module render: ${cur-this.nowTime}ms`)
  }

  handleClick = (idx) => {
    if (idx != this.props.activeFleetId) {
      this.context.selectFleet(idx)
    }
  }

  changeMainView = () => {
    this.context.selectTab('mainView')
  }

  render() {
    return (
      <Panel onDoubleClick={this.changeMainView}>
        <link rel="stylesheet" href={join(__dirname, 'assets', 'ship.css')} />
        <div className="panel-row">
          <ButtonGroup className="fleet-name-button">
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
          <div
            className={classNames("ship-tab-content", {'ship-tab-content-transition': this.props.enableTransition})}
            style={{left: `-${this.props.activeFleetId}00%`}}>
          {
            [0, 1, 2, 3].map((i) =>
              <div className="ship-deck" key={i}>
                <FleetShipView fleetId={i} />
              </div>
            )
          }
          </div>
        </div>
      </Panel>
    )
  }
})

export default {
  name: 'ShipView',
  priority: 100000.1,
  displayName: <span><FontAwesome key={0} name='bars' />{__(' Fleet')}</span>,
  description: '舰队展示页面，展示舰队详情信息',
  reactClass: ShipView,
}
