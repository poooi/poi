/* global getStore */
import { connect } from 'react-redux'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { get, memoize } from 'lodash'
import { createSelector } from 'reselect'
import { Button, ResizeSensor } from '@blueprintjs/core'
import styled from 'styled-components'

import { PaneBodyMini, LBViewMini } from './mini-ship-pane'
import { LandbaseButton } from '../../../ship-parts/landbase-button'
import { fleetStateSelectorFactory } from 'views/utils/selectors'
import { getFleetIntent, DEFAULT_FLEET_NAMES } from 'views/utils/game-utils'
import {
  FleetNameButtonContainer,
  FleetNameButton as FleetNameButtonLarge,
  ShipDeck,
  ShipTabContent,
} from 'views/components/ship-parts/styled-components'
import { CardWrapper as CardWrapperL } from '../styled-components'

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

const CardWrapper = styled(CardWrapperL)`
  font-size: 14px;
  height: 100%;
  display: flex;
  flex-direction: column;
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

  static getDerivedStateFromProps(props, state) {
    if (props.activeFleetId !== state.activeFleetId) {
      return {
        prevFleetId: state.activeFleetId,
        activeFleetId: props.activeFleetId,
      }
    }
    return null
  }

  constructor(props) {
    super(props)
    this.nowTime = 0
  }

  state = {
    activeFleetId: this.props.activeFleetId,
    prevFleetId: null,
  }

  handleTransitionEnd = i => {
    if (i === this.state.prevFleetId) {
      this.setState({ prevFleetId: null })
    }
  }

  handleClick = idx => {
    if (idx != this.state.activeFleetId) {
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

  handleResize = entries => {
    entries.forEach(entry => {
      const { width, height } = entry.contentRect
      if (
        width !== 0 &&
        height !== 0 &&
        (width !== getStore('layout.minishippane.width') ||
          height !== getStore('layout.minishippane.height'))
      ) {
        this.props.dispatch({
          type: '@@LayoutUpdate',
          value: {
            minishippane: {
              width,
              height,
            },
          },
        })
      }
    })
  }

  render() {
    const { activeFleetId, prevFleetId } = this.state
    return (
      <CardWrapper
        onDoubleClick={this.handleChangeShipView}
        elevation={this.props.editable ? 2 : 0}
        interactive={this.props.editable}
      >
        <FleetNameButtonContainer className="miniship-switch">
          <FleetNameButton className="miniship-fleet-switch">
            {[0, 1, 2, 3].map(i => (
              <ShipViewSwitchButton
                key={i}
                fleetId={i}
                disabled={i + 1 > this.props.fleetCount}
                onClick={this.handleClick.bind(this, i)}
                activeFleetId={activeFleetId}
              />
            ))}
          </FleetNameButton>
          <LandbaseButton
            key={4}
            fleetId={4}
            disabled={this.props.airBaseCnt === 0}
            onClick={e => this.handleClick(4)}
            activeFleetId={activeFleetId}
            isMini={true}
          />
        </FleetNameButtonContainer>
        <ResizeSensor onResize={this.handleResize}>
          <ShipTabContent className="miniship-fleet-content">
            {[0, 1, 2, 3].map(i => (
              <ShipDeck
                className="ship-deck"
                onTransitionEnd={() => this.handleTransitionEnd(i)}
                key={i}
                transition={
                  this.props.enableTransition && (activeFleetId === i || prevFleetId === i)
                }
                active={activeFleetId === i || prevFleetId === i}
                left={activeFleetId > i}
                right={activeFleetId < i}
              >
                <PaneBodyMini key={i} fleetId={i} />
              </ShipDeck>
            ))}
            <ShipDeck
              className="ship-deck"
              onTransitionEnd={() => this.handleTransitionEnd(4)}
              key={4}
              transition={this.props.enableTransition && (activeFleetId === 4 || prevFleetId === 4)}
              active={activeFleetId === 4 || prevFleetId === 4}
              left={activeFleetId > 4}
              right={activeFleetId < 4}
            >
              <LBViewMini />
            </ShipDeck>
          </ShipTabContent>
        </ResizeSensor>
      </CardWrapper>
    )
  }
}
