import type { RootState } from 'views/redux/reducer-factory'

import { Button, ResizeSensor } from '@blueprintjs/core'
import { debounce, memoize } from 'lodash'
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import { styled } from 'styled-components'
import {
  FleetNameButtonContainer,
  FleetNameButton as FleetNameButtonLarge,
  ShipDeck,
  ShipTabContent,
} from 'views/components/ship-parts/styled-components'
import { getStore } from 'views/create-store'
import { createLayoutUpdateAction } from 'views/redux/actions/layout'
import { createTabSwitchAction } from 'views/redux/actions/ui'
import { getFleetIntent, DEFAULT_FLEET_NAMES } from 'views/utils/game-utils'
import { fleetStateSelectorFactory } from 'views/utils/selectors'

import { LandbaseButton } from '../../../ship-parts/landbase-button'
import { CardWrapper as CardWrapperL } from '../styled-components'
import { PaneBodyMini, LBViewMini } from './mini-ship-pane'

const FleetNameButton = styled(FleetNameButtonLarge)`
  .bp6-button {
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

const FLEET_INDICES = [0, 1, 2, 3] as const

const shipViewSwitchButtonDataSelectorFactory = memoize((fleetId: number) =>
  createSelector([fleetStateSelectorFactory(fleetId)], (fleetState) => ({ fleetState })),
)

const ShipViewSwitchButton = ({
  fleetId,
  activeFleetId,
  onClick,
  disabled,
}: {
  fleetId: number
  activeFleetId: number
  onClick: () => void
  disabled: boolean
}) => {
  const selector = React.useMemo(() => shipViewSwitchButtonDataSelectorFactory(fleetId), [fleetId])
  const { fleetState } = useSelector((state: RootState) => selector(state))
  return (
    <Button
      intent={getFleetIntent(fleetState, disabled)}
      onClick={onClick}
      disabled={disabled}
      active={fleetId === activeFleetId}
    >
      {DEFAULT_FLEET_NAMES[fleetId]}
    </Button>
  )
}

export const MiniShip = ({ editable }: { editable?: boolean }) => {
  const dispatch = useDispatch()
  const airBaseCnt = useSelector((state: RootState) => state.info?.airbase?.length ?? 0)
  const enableTransition = useSelector(
    (state: RootState) => state.config?.poi?.transition?.enable ?? true,
  )
  const fleetCount = useSelector((state: RootState) => state.info?.fleets?.length ?? 4)
  const activeFleetId = useSelector((state: RootState) => state.ui?.activeFleetId ?? 0)

  const [prevFleetId, setPrevFleetId] = useState<number | null>(null)

  useLayoutEffect(() => {
    return () => {
      setPrevFleetId(activeFleetId)
    }
  }, [activeFleetId])

  const handleTransitionEnd = (i: number) =>
    requestAnimationFrame(() => {
      if (i === prevFleetId) {
        setPrevFleetId(null)
      }
    })

  const handleClick = useCallback(
    (idx: number) => {
      if (idx !== activeFleetId) {
        dispatch(createTabSwitchAction({ tabInfo: { activeFleetId: idx } }))
      }
    },
    [dispatch, activeFleetId],
  )

  const handleChangeShipView = useCallback(() => {
    dispatch(createTabSwitchAction({ tabInfo: { activeMainTab: 'ship-view' } }))
  }, [dispatch])

  const handleResize = useMemo(
    () =>
      debounce((entries: ResizeObserverEntry[]) => {
        entries.forEach((entry) => {
          const { width, height } = entry.contentRect
          if (
            width !== 0 &&
            height !== 0 &&
            (width !== getStore('layout.minishippane.width') ||
              height !== getStore('layout.minishippane.height'))
          ) {
            dispatch(createLayoutUpdateAction({ minishippane: { width, height } }))
          }
        })
      }, 50),
    [dispatch],
  )

  useEffect(() => {
    return () => handleResize.cancel()
  }, [handleResize])

  return (
    <CardWrapper
      onDoubleClick={handleChangeShipView}
      elevation={editable ? 2 : 0}
      interactive={editable}
    >
      <FleetNameButtonContainer className="miniship-switch">
        <FleetNameButton className="miniship-fleet-switch">
          {FLEET_INDICES.map((i) => (
            <ShipViewSwitchButton
              key={i}
              fleetId={i}
              disabled={i + 1 > fleetCount}
              onClick={() => handleClick(i)}
              activeFleetId={activeFleetId}
            />
          ))}
        </FleetNameButton>
        <LandbaseButton
          key={4}
          fleetId={4}
          disabled={airBaseCnt === 0}
          onClick={() => handleClick(4)}
          activeFleetId={activeFleetId}
          isMini
        />
      </FleetNameButtonContainer>
      <ResizeSensor onResize={handleResize}>
        <ShipTabContent className="miniship-fleet-content">
          {FLEET_INDICES.map((i) => (
            <ShipDeck
              className="ship-deck"
              onTransitionEnd={() => handleTransitionEnd(i)}
              key={i}
              transition={enableTransition && (activeFleetId === i || prevFleetId === i)}
              active={activeFleetId === i || prevFleetId === i}
              left={activeFleetId > i}
              right={activeFleetId < i}
            >
              <PaneBodyMini key={i} fleetId={i} />
            </ShipDeck>
          ))}
          <ShipDeck
            className="ship-deck"
            onTransitionEnd={() => handleTransitionEnd(4)}
            key={4}
            transition={enableTransition && (activeFleetId === 4 || prevFleetId === 4)}
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
