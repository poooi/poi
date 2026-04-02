import { Button, ResizeSensor } from '@blueprintjs/core'
import { get, memoize, times } from 'lodash'
import React, { Component } from 'react'
import FontAwesome from 'react-fontawesome'
import { Trans, withTranslation, type WithTranslation } from 'react-i18next'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { createSelector } from 'reselect'
import { FleetStat } from 'views/components/ship-parts/fleet-stat'
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
import { getFleetIntent, DEFAULT_FLEET_NAMES } from 'views/utils/game-utils'
import {
  fleetNameSelectorFactory,
  fleetStateSelectorFactory,
  fleetShipsIdSelectorFactory,
  fleetShipsDataWithEscapeSelectorFactory,
} from 'views/utils/selectors'
import { isSpAttackAvailable } from 'views/utils/sp_attack'

import { LandbaseButton } from '../ship-parts/landbase-button'
import { SquardRow } from './lbac-view'
import { ShipRow } from './ship-item'

interface StateData {
  const?: {
    $mapareas?: Record<number, { api_name: string }>
  }
  info?: {
    fleets?: unknown[]
    airbase?: unknown[]
  }
  sortie?: {
    spAttackCount?: number
    combinedFlag?: unknown
  }
  layout?: {
    shippane?: {
      width?: number
      height?: number
    }
  }
  ui?: {
    activeFleetId?: number
  }
  config?: {
    poi?: {
      transition?: {
        enable?: boolean
      }
      appearance?: {
        avatar?: boolean
      }
    }
  }
  [key: string]: unknown
}

interface ShipViewSwitchButtonProps {
  fleetId: number
  activeFleetId: number
  fleetName: string
  fleetState: number
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled: boolean
}

interface FleetShipViewProps {
  fleetId: number
  shipsId: number[]
  enableAvatar: boolean
  width: number
  isSpAttack: boolean
}

interface LBViewProps extends WithTranslation {
  areaIds: number[]
  mapareas: Record<number, { api_name: string }>
  enableAvatar: boolean
  width: number
}

interface ReactClassProps extends WithTranslation {
  enableTransition: boolean
  fleetCount: number
  activeFleetId: number
  airBaseCnt: number
  enableAvatar: boolean
  width: number
  dispatch: (action: { type: string; [key: string]: unknown }) => void
}

interface ReactClassState {
  activeFleetId: number
  prevFleetId: number | null
}

/* global getStore */

const shipRowWidthSelector = (state: StateData) => get(state, 'layout.shippane.width', 450)

const shipViewSwitchButtonDataSelectorFactory = memoize((fleetId: number) =>
  createSelector(
    [fleetNameSelectorFactory(fleetId), fleetStateSelectorFactory(fleetId)],
    (fleetName, fleetState) => ({
      fleetState,
      fleetName,
    }),
  ),
)

const ShipViewSwitchButton: React.FC<ShipViewSwitchButtonProps> = ({
  fleetId,
  activeFleetId,
  fleetName,
  fleetState,
  onClick,
  disabled,
}) => (
  <Button
    intent={getFleetIntent(fleetState, disabled)}
    onClick={onClick}
    disabled={disabled}
    active={fleetId === activeFleetId}
  >
    {fleetName || DEFAULT_FLEET_NAMES[fleetId]}
  </Button>
)

const ConnectedShipViewSwitchButton = connect(
  (state: StateData, { fleetId }: { fleetId: number }) =>
    shipViewSwitchButtonDataSelectorFactory(fleetId)(state),
)(ShipViewSwitchButton)

const fleetShipViewDataSelectorFactory = memoize((fleetId: number) =>
  createSelector(
    [
      fleetShipsIdSelectorFactory(fleetId),
      fleetShipsDataWithEscapeSelectorFactory(fleetId),
      (state: StateData) => get(state, 'sortie.spAttackCount'),
      (state: StateData) => get(state, 'info.useitems.95.api_count'),
      (state: StateData) => get(state, 'sortie.combinedFlag'),
    ],
    (shipsId, shipsData, spAttackCount, submarineSupplyCount, combinedFlag) => ({
      shipsId,
      isSpAttack: isSpAttackAvailable(shipsData, {
        spAttackCount,
        submarineSupplyCount,
        combinedFlag,
        fleetId,
      }),
    }),
  ),
)

const FleetShipView: React.FC<FleetShipViewProps> = ({
  fleetId,
  shipsId,
  enableAvatar,
  width,
  isSpAttack,
}) => (
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
)

const ConnectedFleetShipView = connect((state: StateData, { fleetId }: { fleetId: number }) =>
  fleetShipViewDataSelectorFactory(fleetId)(state),
)(FleetShipView)

const LBView: React.FC<LBViewProps> = ({ areaIds, mapareas, t, enableAvatar, width }) => (
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
)

const ConnectedLBView = compose(
  withTranslation(['resources']),
  connect((state: StateData) => ({
    areaIds: get(state, 'info.airbase', []).map((a: { api_area_id: number }) => a.api_area_id),
    mapareas: get(state, 'const.$mapareas', {}),
  })),
)(LBView)

class ReactClassComponent extends Component<ReactClassProps, ReactClassState> {
  static displayName = 'ShipView'

  constructor(props: ReactClassProps) {
    super(props)
    this.state = {
      activeFleetId: props.activeFleetId,
      prevFleetId: null,
    }
  }

  static getDerivedStateFromProps(
    props: ReactClassProps,
    state: ReactClassState,
  ): Partial<ReactClassState> | null {
    if (props.activeFleetId !== state.activeFleetId) {
      return {
        prevFleetId: state.activeFleetId,
        activeFleetId: props.activeFleetId,
      }
    }
    return null
  }

  handleTransitionEnd = (i: number) => {
    if (i === this.state.prevFleetId) {
      this.setState({ prevFleetId: null })
    }
  }

  handleClick = (idx: number) => {
    if (idx !== this.state.activeFleetId) {
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

  handleResize = (entries: ResizeObserverEntry[]) => {
    entries.forEach((entry) => {
      const { width, height } = entry.contentRect
      if (
        width !== 0 &&
        height !== 0 &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- getStore returns unknown, layout values are known to be numbers
        (width !== (getStore('layout.shippane.width') as number) ||
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- getStore returns unknown, layout values are known to be numbers
          height !== (getStore('layout.shippane.height') as number))
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
              {times(4).map((i) => (
                <ConnectedShipViewSwitchButton
                  key={i}
                  fleetId={i}
                  disabled={i + 1 > this.props.fleetCount}
                  onClick={() => this.handleClick(i)}
                  activeFleetId={activeFleetId}
                />
              ))}
            </FleetNameButton>
            <LandbaseButton
              key={4}
              fleetId={4}
              disabled={this.props.airBaseCnt === 0}
              onClick={() => this.handleClick(4)}
              activeFleetId={activeFleetId}
              isMini={false}
            />
          </FleetNameButtonContainer>
          <ResizeSensor onResize={this.handleResize}>
            <ShipTabContainer className="ship-tab-container">
              <ShipTabContent className="ship-tab-content">
                {times(4).map((i) => (
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
                    <ConnectedFleetShipView
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
                  <ConnectedLBView
                    enableAvatar={this.props.enableAvatar}
                    width={this.props.width}
                  />
                </ShipDeck>
              </ShipTabContent>
            </ShipTabContainer>
          </ResizeSensor>
        </ShipCard>
      </ShipWrapper>
    )
  }
}

const mapStateToProps = (state: StateData) => ({
  enableTransition: get(state, 'config.poi.transition.enable', true),
  fleetCount: get(state, 'info.fleets.length', 4),
  activeFleetId: get(state, 'ui.activeFleetId', 0),
  airBaseCnt: get(state, 'info.airbase.length', 0),
  enableAvatar: get(state, 'config.poi.appearance.avatar', true),
  width: shipRowWidthSelector(state),
})

export const reactClass = connect(mapStateToProps)(ReactClassComponent)

export const displayName = (
  <span>
    <Trans>main:Fleet</Trans>
  </span>
)

export const icon = <FontAwesome key={0} name="bars" />

export const name = 'ship-view'
