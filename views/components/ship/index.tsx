import type { FC } from 'react'
import type { RootState } from 'views/redux/reducer-factory'

import { Button, ResizeSensor } from '@blueprintjs/core'
import { memoize, times } from 'lodash'
import React, { useCallback, useState } from 'react'
import FontAwesome from 'react-fontawesome'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import { FleetStat } from 'views/components/ship-parts/fleet-stat'
import {
  AirbaseArea,
  FleetNameButton,
  FleetNameButtonContainer,
  ShipCard,
  ShipDeck,
  ShipDetails,
  ShipTabContainer,
  ShipTabContent,
  ShipWrapper,
} from 'views/components/ship-parts/styled-components'
import { getStore } from 'views/create-store'
import { DEFAULT_FLEET_NAMES, getFleetIntent } from 'views/utils/game-utils'
import {
  fleetNameSelectorFactory,
  fleetShipsDataWithEscapeSelectorFactory,
  fleetShipsIdSelectorFactory,
  fleetStateSelectorFactory,
} from 'views/utils/selectors'
import { isSpAttackAvailable } from 'views/utils/sp_attack'

import { LandbaseButton } from '../ship-parts/landbase-button'
import { SquardRow } from './lbac-view'
import { ShipRow } from './ship-item'

const shipRowWidthSelector = (state: RootState) => state.layout?.shippane?.width ?? 450

const shipViewSwitchButtonDataSelectorFactory = memoize((fleetId: number) =>
  createSelector(
    [fleetNameSelectorFactory(fleetId), fleetStateSelectorFactory(fleetId)],
    (fleetName, fleetState) => ({ fleetState, fleetName }),
  ),
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
  const { fleetName, fleetState } = useSelector((state: RootState) => selector(state))
  return (
    <Button
      intent={getFleetIntent(fleetState, disabled)}
      onClick={onClick}
      disabled={disabled}
      active={fleetId === activeFleetId}
    >
      {fleetName || DEFAULT_FLEET_NAMES[fleetId]}
    </Button>
  )
}

const fleetShipViewDataSelectorFactory = memoize((fleetId: number) =>
  createSelector(
    [
      fleetShipsIdSelectorFactory(fleetId),
      fleetShipsDataWithEscapeSelectorFactory(fleetId),
      (state: RootState) => state?.sortie?.spAttackCount,
      (state: RootState) => state?.info?.useitems?.[95]?.api_count,
      (state: RootState) => state?.sortie?.combinedFlag,
    ],
    (shipsId, shipsData, spAttackCount, submarineSupplyCount, combinedFlag) => ({
      shipsId,
      isSpAttack: isSpAttackAvailable(shipsData ?? [], {
        spAttackCount: spAttackCount ?? {},
        submarineSupplyCount: submarineSupplyCount ?? 0,
        combinedFlag: combinedFlag != null ? Boolean(combinedFlag) : undefined,
        fleetId,
      }),
    }),
  ),
)

const FleetShipView = ({
  fleetId,
  enableAvatar,
  width,
}: {
  fleetId: number
  enableAvatar: boolean
  width: number
}) => {
  const selector = React.useMemo(() => fleetShipViewDataSelectorFactory(fleetId), [fleetId])
  const { shipsId, isSpAttack } = useSelector((state: RootState) => selector(state))
  return (
    <>
      <div className="fleet-name">
        <FleetStat fleetId={fleetId} isMini={false} />
      </div>
      <ShipDetails className="ship-details">
        {(shipsId ?? []).map((shipId, i) => (
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
}

const LBView = ({ enableAvatar, width }: { enableAvatar: boolean; width: number }) => {
  const { t } = useTranslation('resources')
  const areaIds = useSelector((state: RootState) =>
    (state?.info?.airbase ?? []).map((a) => a.api_area_id),
  )
  const mapareas = useSelector((state: RootState) => state.const?.$mapareas ?? {})
  return (
    <ShipDetails className="ship-details">
      {areaIds.map(
        (id, i) =>
          id != null &&
          mapareas[id] != null &&
          (id === areaIds[i - 1] ? (
            <SquardRow key={i} squardId={i} enableAvatar={enableAvatar} compact={width < 480} />
          ) : (
            <React.Fragment key={i}>
              <AirbaseArea className="airbase-area">
                [{id}] {mapareas[id] ? t(`resources:${mapareas[id].api_name}`) : ''}
              </AirbaseArea>
              <SquardRow squardId={i} enableAvatar={enableAvatar} compact={width < 480} />
            </React.Fragment>
          )),
      )}
    </ShipDetails>
  )
}

interface ShipViewProps {
  enableTransition: boolean
  fleetCount: number
  activeFleetId: number
  airBaseCnt: number
  enableAvatar: boolean
  width: number
  dispatch: ReturnType<typeof useDispatch>
}

const ShipViewInner = ({
  enableTransition,
  fleetCount,
  activeFleetId: activeFleetIdProp,
  airBaseCnt,
  enableAvatar,
  width,
  dispatch,
}: ShipViewProps) => {
  const [prevPropFleetId, setPrevPropFleetId] = useState(activeFleetIdProp)
  const [activeFleetId, setActiveFleetId] = useState(activeFleetIdProp)
  const [prevFleetId, setPrevFleetId] = useState<number | null>(null)

  if (activeFleetIdProp !== prevPropFleetId) {
    setPrevPropFleetId(activeFleetIdProp)
    setPrevFleetId(activeFleetId)
    setActiveFleetId(activeFleetIdProp)
  }

  const handleTransitionEnd = useCallback(
    (i: number) => setPrevFleetId((prev) => (i === prev ? null : prev)),
    [],
  )

  const handleClick = useCallback(
    (idx: number) => {
      if (idx !== activeFleetId) {
        dispatch({ type: '@@TabSwitch', tabInfo: { activeFleetId: idx } })
      }
    },
    [dispatch, activeFleetId],
  )

  const changeMainView = useCallback(() => {
    dispatch({ type: '@@TabSwitch', tabInfo: { activeMainTab: 'main-view' } })
  }, [dispatch])

  const handleResize = useCallback(
    (entries: ResizeObserverEntry[]) => {
      entries.forEach((entry) => {
        const { width: w, height: h } = entry.contentRect
        if (
          w !== 0 &&
          h !== 0 &&
          (w !== getStore('layout.shippane.width') || h !== getStore('layout.shippane.height'))
        ) {
          dispatch({ type: '@@LayoutUpdate', value: { shippane: { width: w, height: h } } })
        }
      })
    },
    [dispatch],
  )

  return (
    <ShipWrapper className="ship-wrapper">
      <ShipCard onDoubleClick={changeMainView} className="ship-card">
        <FleetNameButtonContainer className="div-row fleet-name-button-container">
          <FleetNameButton className="fleet-name-button">
            {times(4).map((i) => (
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
            isMini={false}
          />
        </FleetNameButtonContainer>
        <ResizeSensor onResize={handleResize}>
          <ShipTabContainer className="ship-tab-container">
            <ShipTabContent className="ship-tab-content">
              {times(4).map((i) => (
                <ShipDeck
                  className="ship-deck"
                  onTransitionEnd={() => handleTransitionEnd(i)}
                  key={i}
                  transition={enableTransition && (activeFleetId === i || prevFleetId === i)}
                  active={activeFleetId === i || prevFleetId === i}
                  left={activeFleetId > i}
                  right={activeFleetId < i}
                >
                  <FleetShipView fleetId={i} enableAvatar={enableAvatar} width={width} />
                </ShipDeck>
              ))}
              <ShipDeck
                className="ship-deck ship-lbac"
                onTransitionEnd={() => handleTransitionEnd(4)}
                key={4}
                transition={enableTransition && (activeFleetId === 4 || prevFleetId === 4)}
                active={activeFleetId === 4 || prevFleetId === 4}
                left={activeFleetId > 4}
                right={activeFleetId < 4}
              >
                <LBView enableAvatar={enableAvatar} width={width} />
              </ShipDeck>
            </ShipTabContent>
          </ShipTabContainer>
        </ResizeSensor>
      </ShipCard>
    </ShipWrapper>
  )
}

const ShipView: FC = () => {
  const dispatch = useDispatch()
  const enableTransition = useSelector(
    (state: RootState) => state.config?.poi?.transition?.enable ?? true,
  )
  const fleetCount = useSelector((state: RootState) => state.info?.fleets?.length ?? 4)
  const activeFleetId = useSelector((state: RootState) => state.ui?.activeFleetId ?? 0)
  const airBaseCnt = useSelector((state: RootState) => state.info?.airbase?.length ?? 0)
  const enableAvatar = useSelector(
    (state: RootState) => state.config?.poi?.appearance?.avatar ?? true,
  )
  const width = useSelector(shipRowWidthSelector)

  return (
    <ShipViewInner
      enableTransition={enableTransition as boolean}
      fleetCount={fleetCount as number}
      activeFleetId={activeFleetId as number}
      airBaseCnt={airBaseCnt as number}
      enableAvatar={enableAvatar as boolean}
      width={width}
      dispatch={dispatch}
    />
  )
}

export const reactClass = ShipView

export const name = 'ship-view'

export const displayName = (
  <span>
    <Trans>main:Fleet</Trans>
  </span>
)

export const icon = <FontAwesome key={0} name="bars" />
