/* global getStore */
import { connect } from 'react-redux'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { get, memoize, times } from 'lodash'
import { createSelector } from 'reselect'
import { withNamespaces, Trans } from 'react-i18next'
import { Button, ResizeSensor } from '@blueprintjs/core'
import { compose } from 'redux'

import { ShipRow } from './ship-item'
import { SquardRow } from './lbac-view'
import { LandbaseButton } from '../ship-parts/landbase-button'
import { FleetStat } from 'views/components/ship-parts/fleet-stat'
import {
  fleetNameSelectorFactory,
  fleetStateSelectorFactory,
  fleetShipsIdSelectorFactory,
  fleetShipsDataWithEscapeSelectorFactory,
} from 'views/utils/selectors'
import { getFleetIntent, DEFAULT_FLEET_NAMES } from 'views/utils/game-utils'
import {
  ShipCard,
  ShipWrapper,
  ShipTabContainer,
  ShipTabContent,
  ShipDeck,
  ShipDetails,
  AirbaseArea,
  FleetNameButtonContainer,
  FleetNameButton,
} from 'views/components/ship-parts/styled-components'
import { isSpAttack } from 'views/utils/sp_attack'

const shipRowWidthSelector = state => get(state, 'layout.shippane.width', 450)

const shipViewSwitchButtonDataSelectorFactory = memoize(fleetId =>
  createSelector(
    [fleetNameSelectorFactory(fleetId), fleetStateSelectorFactory(fleetId)],
    (fleetName, fleetState) => ({
      fleetState,
      fleetName,
    }),
  ),
)

const ShipViewSwitchButton = connect((state, { fleetId }) =>
  shipViewSwitchButtonDataSelectorFactory(fleetId)(state),
)(({ fleetId, activeFleetId, fleetName, fleetState, onClick, disabled }) => (
  <Button
    intent={getFleetIntent(fleetState, disabled)}
    onClick={onClick}
    disabled={disabled}
    active={fleetId == activeFleetId}
  >
    {fleetName || DEFAULT_FLEET_NAMES[fleetId]}
  </Button>
))

const fleetShipViewDataSelectorFactory = memoize(fleetId =>
  createSelector(
    [
      fleetShipsIdSelectorFactory(fleetId),
      fleetShipsDataWithEscapeSelectorFactory(fleetId),
      state => state.sortie.spAttackUsed,
    ],
    (shipsId, shipsData, spAttackUsed) => ({
      shipsId,
      isSpAttack: !spAttackUsed && isSpAttack(shipsData),
    }),
  ),
)

const FleetShipView = connect((state, { fleetId }) =>
  fleetShipViewDataSelectorFactory(fleetId)(state),
)(({ fleetId, shipsId, enableAvatar, width, isSpAttack }) => (
  <>
    <div className="fleet-name">
      <FleetStat fleetId={fleetId} isMini={false} />
    </div>
    <ShipDetails className="ship-details">
      {(shipsId || []).map((shipId, i) => (
        <ShipRow
          key={shipId}
          shipId={shipId}
          enableAvatar={enableAvatar}
          compact={width < 540}
          showSpAttackLabel={i === 0 && isSpAttack}
        />
      ))}
    </ShipDetails>
  </>
))

const LBView = compose(
  withNamespaces(['resources']),
  connect(state => ({
    areaIds: get(state, 'info.airbase', []).map(a => a.api_area_id),
    mapareas: get(state, 'const.$mapareas', {}),
  })),
)(({ areaIds, mapareas, t, enableAvatar, width }) => (
  <ShipDetails className="ship-details">
    {areaIds.map(
      (id, i) =>
        mapareas[id] != null &&
        (id === areaIds[i - 1] ? (
          <SquardRow key={i} squardId={i} enableAvatar={enableAvatar} compact={width < 480} />
        ) : (
          <React.Fragment key={i}>
            <AirbaseArea className="airbase-area">
              [{id}] {mapareas[id] ? t(`resources:${mapareas[id].api_name}`) : ''}
            </AirbaseArea>
            <SquardRow key={i} squardId={i} enableAvatar={enableAvatar} compact={width < 480} />
          </React.Fragment>
        )),
    )}
  </ShipDetails>
))

@connect((state, props) => ({
  enableTransition: get(state, 'config.poi.transition.enable', true),
  fleetCount: get(state, 'info.fleets.length', 4),
  activeFleetId: get(state, 'ui.activeFleetId', 0),
  airBaseCnt: get(state, 'info.airbase.length', 0),
  enableAvatar: get(state, 'config.poi.appearance.avatar', true),
  width: shipRowWidthSelector(state),
}))
export class reactClass extends Component {
  static propTypes = {
    enableTransition: PropTypes.bool.isRequired,
    fleetCount: PropTypes.number.isRequired,
    activeFleetId: PropTypes.number.isRequired,
    airBaseCnt: PropTypes.number.isRequired,
    enableAvatar: PropTypes.bool,
    width: PropTypes.number,
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

  changeMainView = () => {
    this.props.dispatch({
      type: '@@TabSwitch',
      tabInfo: {
        activeMainTab: 'main-view',
      },
    })
  }

  handleResize = entries => {
    entries.forEach(entry => {
      const { width, height } = entry.contentRect
      if (
        width !== 0 &&
        height !== 0 &&
        (width !== getStore('layout.shippane.width') ||
          height !== getStore('layout.shippane.height'))
      ) {
        this.props.dispatch({
          type: '@@LayoutUpdate',
          value: {
            shippane: {
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
      <ShipWrapper className="ship-wrapper">
        <ShipCard onDoubleClick={this.changeMainView} className="ship-card">
          <FleetNameButtonContainer className="div-row fleet-name-button-container">
            <FleetNameButton className="fleet-name-button">
              {times(4).map(i => (
                <ShipViewSwitchButton
                  key={i}
                  fleetId={i}
                  disabled={i + 1 > this.props.fleetCount}
                  onClick={e => this.handleClick(i)}
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
              isMini={false}
            />
          </FleetNameButtonContainer>
          <ResizeSensor onResize={this.handleResize}>
            <ShipTabContainer className="ship-tab-container">
              <ShipTabContent className="ship-tab-content">
                {times(4).map(i => (
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
                    <FleetShipView
                      fleetId={i}
                      enableAvatar={this.props.enableAvatar}
                      width={this.props.width}
                    />
                  </ShipDeck>
                ))}
                <ShipDeck
                  className="ship-deck ship-lbac"
                  onTransitionEnd={() => this.handleTransitionEnd(4)}
                  key={4}
                  transition={
                    this.props.enableTransition && (activeFleetId === 4 || prevFleetId === 4)
                  }
                  active={activeFleetId === 4 || prevFleetId === 4}
                  left={activeFleetId > 4}
                  right={activeFleetId < 4}
                >
                  <LBView enableAvatar={this.props.enableAvatar} width={this.props.width} />
                </ShipDeck>
              </ShipTabContent>
            </ShipTabContainer>
          </ResizeSensor>
        </ShipCard>
      </ShipWrapper>
    )
  }
}

export const displayName = (
  <span>
    <FontAwesome key={0} name="bars" /> <Trans>main:Fleet</Trans>
  </span>
)
