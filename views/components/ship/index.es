import { join } from 'path-extra'
import { connect } from 'react-redux'
import classNames from 'classnames'
import React, { Component, PropTypes } from 'react'
import { Panel, Button, ButtonGroup } from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import { get, memoize } from 'lodash'
import { createSelector } from 'reselect'

const {i18n, dbg} = window
const __ = i18n.main.__.bind(i18n.main)

import { ShipRow } from './shipitem'
import TopAlert from 'views/components/ship-parts/topalert'
import {
  fleetNameSelectorFactory,
  fleetStateSelectorFactory,
  fleetShipsIdSelectorFactory,
} from 'views/utils/selectors'

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
  enableTransition: get(state, 'config.poi.transition.enable', true),
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
