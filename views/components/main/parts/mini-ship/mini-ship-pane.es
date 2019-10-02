import { connect } from 'react-redux'
import { MiniShipRow, MiniSquardRow } from './mini-ship-item'
import React, { Fragment } from 'react'
import { get } from 'lodash'
import { withNamespaces } from 'react-i18next'
import { compose } from 'redux'
import styled from 'styled-components'

import { FleetStat } from 'views/components/ship-parts/fleet-stat'
import { ScrollShadow } from 'views/components/etc/scroll-shadow'
import { fleetShipsIdSelectorFactory } from 'views/utils/selectors'

const miniShipRowWidthSelector = state => get(state, 'layout.minishippane.width', 250)

const ShipDetailsMini = styled(ScrollShadow)`
  flex: 1;
  overflow: scroll;
`

export const PaneBodyMini = connect(() => {
  return (state, { fleetId }) => ({
    shipsId: fleetShipsIdSelectorFactory(fleetId)(state),
    enableAvatar: get(state, 'config.poi.appearance.avatar', true),
    width: miniShipRowWidthSelector(state),
  })
})(({ fleetId, shipsId, enableAvatar, width }) => (
  <>
    <FleetStat fleetId={fleetId} isMini={true} />
    <ShipDetailsMini className="ship-details-mini">
      {(shipsId || []).map((shipId, i) => (
        <MiniShipRow
          key={shipId}
          shipId={shipId}
          enableAvatar={enableAvatar}
          compact={width < 240}
        />
      ))}
    </ShipDetailsMini>
  </>
))

const AirbaseArea = styled.div`
  width: 100%;
  white-space: nowrap;
  margin-top: 0;
  text-align: left;
`

export const LBViewMini = compose(
  withNamespaces(['resources']),
  connect(state => ({
    areaIds: get(state, 'info.airbase', []).map(a => a.api_area_id),
    mapareas: get(state, 'const.$mapareas', {}),
    enableAvatar: get(state, 'config.poi.appearance.avatar', true),
    width: miniShipRowWidthSelector(state),
  })),
)(({ areaIds, mapareas, t, enableAvatar, width }) => (
  <ShipDetailsMini className="ship-details-mini">
    {areaIds.map(
      (id, i) =>
        mapareas[id] &&
        (id === areaIds[i - 1] ? (
          <MiniSquardRow key={i} squardId={i} enableAvatar={enableAvatar} compact={width < 280} />
        ) : (
          <Fragment key={i}>
            <AirbaseArea className="airbase-area">
              [{id}] {mapareas[id] ? t(`resources:${mapareas[id].api_name}`) : ''}
            </AirbaseArea>
            <MiniSquardRow key={i} squardId={i} enableAvatar={enableAvatar} compact={width < 280} />
          </Fragment>
        )),
    )}
  </ShipDetailsMini>
))
