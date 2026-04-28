import type { RootState } from 'views/redux/reducer-factory'

import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { styled } from 'styled-components'
import ScrollShadow from 'views/components/etc/scroll-shadow'
import { FleetStat } from 'views/components/ship-parts/fleet-stat'
import { fleetShipsIdSelectorFactory } from 'views/utils/selectors'

import { ShipRow } from '../../../ship/ship-item'
import { MiniShipRow, MiniSquardRow } from './mini-ship-item'

const miniShipRowWidthSelector = (state: RootState) => state.layout?.minishippane?.width ?? 250

const ShipDetailsMini = styled(ScrollShadow)`
  flex: 1;
  overflow: scroll;
`

export const PaneBodyMini = ({ fleetId }: { fleetId: number }) => {
  const shipsId = useSelector((state: RootState) => fleetShipsIdSelectorFactory(fleetId)(state))
  const enableAvatar = useSelector(
    (state: RootState) => state.config?.poi?.appearance?.avatar ?? true,
  )
  const enableOverviewFleetDetail = useSelector(
    (state: RootState) => state.config?.poi?.appearance?.enableOverviewFleetDetail ?? false,
  )
  const width = useSelector(miniShipRowWidthSelector)

  return (
    <>
      <FleetStat fleetId={fleetId} isMini={!enableOverviewFleetDetail} isMainView />
      <ShipDetailsMini className="ship-details-mini">
        {!enableOverviewFleetDetail
          ? (shipsId ?? []).map((shipId) => (
              <MiniShipRow
                key={shipId}
                shipId={shipId}
                enableAvatar={enableAvatar}
                compact={width < 240}
              />
            ))
          : (shipsId ?? []).map((shipId) => (
              <ShipRow
                key={shipId}
                shipId={shipId}
                enableAvatar={enableAvatar}
                compact={width < 240}
              />
            ))}
      </ShipDetailsMini>
    </>
  )
}

const AirbaseArea = styled.div`
  width: 100%;
  white-space: nowrap;
  margin-top: 0;
  text-align: left;
`

export const LBViewMini = () => {
  const { t } = useTranslation('resources')
  const areaIds = useSelector((state: RootState) => state.info?.airbase ?? []).map(
    (a) => a.api_area_id,
  )
  const mapareas = useSelector((state: RootState) => state.const?.$mapareas ?? {})
  const enableAvatar = useSelector(
    (state: RootState) => state.config?.poi?.appearance?.avatar ?? true,
  )
  const width = useSelector(miniShipRowWidthSelector)

  return (
    <ShipDetailsMini className="ship-details-mini">
      {areaIds.map(
        (id, i) =>
          id != null &&
          mapareas[id] != null &&
          (id === areaIds[i - 1] ? (
            <MiniSquardRow key={i} squardId={i} enableAvatar={enableAvatar} compact={width < 280} />
          ) : (
            <Fragment key={i}>
              <AirbaseArea className="airbase-area">
                [{id}] {mapareas[id] ? t(`resources:${mapareas[id].api_name}`) : ''}
              </AirbaseArea>
              <MiniSquardRow squardId={i} enableAvatar={enableAvatar} compact={width < 280} />
            </Fragment>
          )),
      )}
    </ShipDetailsMini>
  )
}
