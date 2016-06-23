import {relative, join} from 'path-extra'
import {connect} from 'react-redux'
import classNames from 'classnames'
const {_, $, $$, React, ReactBootstrap, ROOT, FontAwesome, toggleModal} = window
const {Button, ButtonGroup} = ReactBootstrap
const {ProgressBar, OverlayTrigger, Tooltip, Alert, Overlay, Label, Panel, Popover} = ReactBootstrap
const __ = i18n.main.__.bind(i18n.main)
const __n = i18n.main.__n.bind(i18n.main)

import {PaneBody} from '../ship-parts'

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
  var state = 0
  if (inBattle)
    state = Math.max(state, 5)
  if (inExpedition)
    state = Math.max(state, 4)
  for (let [ship, $ship] of shipsData) {
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
    const thisFleetShipsDataSelector = makeThisFleetShipsDataSelector()
    const thisFleetSelector = makeThisFleetSelector()
    return (state, props) => {
      const fleet = thisFleetSelector(state, props)
      const inExpedition = fleet ? fleet.api_mission[0] : false
      const inBattle = sortieStatusSelector(state)[props.fleetId]
      const inRepairShipsId = inRepairShipsIdSelector(state)
      const shipsData = thisFleetShipsDataSelector(state, props)
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

const ShipView = connect(() => ({
    // TODO: Move config into redux
    enableTransition: config.get('poi.transition.enable', true),
  })
)(class extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      activeDeck: 0,
    }
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
    if (idx != this.state.activeDeck) {
      const event = new CustomEvent('MiniShip.deckChange', {
        bubbles: true,
        cancelable: true,
        detail: {
          idx: idx
        },
      })
      window.dispatchEvent(event)
      this.setState({
        activeDeck: idx
      })
    }
  }

  handleClickOnce = (e) => {
    const idx = (e.detail || {}).idx
    if (idx != null && idx != this.state.activeDeck)
      this.setState({
        activeDeck: idx
      })
  }

  changeMainView = () => {
    const event = new CustomEvent('tabarea.change', {
      bubbles: true,
      cancelable: true,
      detail: {
        tab: 'mainView'
      },
    })
    window.dispatchEvent(event)
  }

  componentDidMount() {
    window.addEventListener('ShipView.deckChange', this.handleClickOnce)
  }
  componentWillUnmount() {
    window.removeEventListener('ShipView.deckChange', this.handleClickOnce)
  }

  render() {
    return (
      <Panel onDoubleClick={this.changeMainView}>
        <link rel="stylesheet" href={join(relative(ROOT, __dirname), 'assets', 'ship.css')} />
        <div className="panel-row">
          <ButtonGroup className="fleet-name-button">
          {
            [0, 1, 2, 3].map((i) =>
              <ShipViewSwitchButton
                key={i}
                fleetId={i}
                onClick={this.handleClick.bind(this, i)}
                activeFleetId={this.state.activeDeck}
                />
            )
          }
          </ButtonGroup>
        </div>
        <div className="no-scroll">
          <div
            className={classNames("ship-tab-content", {'ship-tab-content-transition': this.props.enableTransition})}
            style={{left: `-${this.state.activeDeck}00%`}}>
          {
            [0, 1, 2, 3].map((i) =>
              <div className="ship-deck" key={i}>
                <PaneBody fleetId={i} />
              </div>
            )
          }
          </div>
        </div>
      </Panel>
    )
  }
})

export const name = 'ShipView'
export const priority = 100000.1
export const displayName = <span><FontAwesome key={0} name='bars' />{__(' Fleet')}</span>
export const description = '舰队展示页面，展示舰队详情信息'
export const reactClass = ShipView
  
