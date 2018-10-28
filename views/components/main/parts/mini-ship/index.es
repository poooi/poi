import { connect } from 'react-redux'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { get, memoize } from 'lodash'
import { createSelector } from 'reselect'
import { Card, Button } from '@blueprintjs/core'
import styled from 'styled-components'

import { PaneBodyMini, LBViewMini } from './mini-ship-pane'
import { LandbaseButton } from '../../../ship-parts/landbase-button'
import { fleetStateSelectorFactory } from 'views/utils/selectors'
import { layoutResizeObserver } from 'views/services/layout'
import { getFleetIntent, DEFAULT_FLEET_NAMES } from 'views/utils/game-utils'
import {
  FleetNameButtonContainer,
  FleetNameButton as FleetNameButtonLarge,
  ShipDeck,
  ShipTabContent,
} from 'views/components/ship-parts/styled-components'

const FleetNameButton = styled(FleetNameButtonLarge)`
  .bp3-button {
    border-width: 0 0 1px;
    height: 18px;
    min-height: 18px;
    margin-top: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
`

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
    active={fleetId == activeFleetId}
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

  componentDidUpdate() {
    this.prevFleetId = this.props.activeFleetId
  }

  componentWillUnmount() {
    layoutResizeObserver.unobserve(this.minishippane)
  }

  componentDidMount() {
    layoutResizeObserver.observe(this.minishippane)
  }

  render() {
    return (
      <Card onDoubleClick={this.handleChangeShipView} elevation={this.props.editable ? 2 : 0} interactive={this.props.editable}>
        <FleetNameButtonContainer className="miniship-switch">
          <FleetNameButton className="miniship-fleet-switch">
            {[0, 1, 2, 3].map(i => (
              <ShipViewSwitchButton
                key={i}
                fleetId={i}
                disabled={i + 1 > this.props.fleetCount}
                onClick={this.handleClick.bind(this, i)}
                activeFleetId={this.props.activeFleetId}
              />
            ))}
          </FleetNameButton>
          <LandbaseButton
            key={4}
            fleetId={4}
            disabled={this.props.airBaseCnt === 0}
            onClick={e => this.handleClick(4)}
            activeFleetId={this.props.activeFleetId}
            isMini={true}
          />
        </FleetNameButtonContainer>
        <ShipTabContent
          className="miniship-fleet-content"
          ref={ref => {
            this.minishippane = ref
          }}
        >
          {[0, 1, 2, 3].map(i => (
            <ShipDeck
              className="ship-deck"
              key={i}
              transition={this.props.enableTransition && (this.props.activeFleetId === i || this.prevFleetId === i)}
              left={this.props.activeFleetId > i}
              right={this.props.activeFleetId < i}>
              <PaneBodyMini key={i} fleetId={i} />
            </ShipDeck>
          ))}
          <ShipDeck
            className="ship-deck"
            key={4}
            transition={this.props.enableTransition && (this.props.activeFleetId === 4 || this.prevFleetId === 4)}
            left={this.props.activeFleetId > 4}
            right={this.props.activeFleetId < 4}>
            <LBViewMini />
          </ShipDeck>
        </ShipTabContent>
      </Card>
    )
  }
}
