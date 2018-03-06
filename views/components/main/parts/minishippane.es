import { connect } from 'react-redux'
import { MiniShipRow, MiniSquardRow } from './minishipitem'
import React from 'react'
import { get } from 'lodash'
import { Alert } from 'react-bootstrap'
import { translate } from 'react-i18next'

import { TopAlert } from 'views/components/ship-parts/topalert'
import { ScrollShadow } from 'views/components/etc/scroll-shadow'
import {
  fleetShipsIdSelectorFactory,
} from 'views/utils/selectors'

const miniShipRowWidthSelector = state => get(state, 'layout.minishippane.width', 250)

export const PaneBodyMini = connect(() => {
  return (state, {fleetId}) => ({
    shipsId: fleetShipsIdSelectorFactory(fleetId)(state),
    enableAvatar: get(state, 'config.poi.enableAvatar', true),
    width: miniShipRowWidthSelector(state),
  })
})(({ fleetId, shipsId, enableAvatar, width }) =>
  <>
    <div className='fleet-name'>
      <TopAlert
        fleetId={fleetId}
        isMini={true}
      />
    </div>
    <ScrollShadow className="ship-details-mini" observerPath={[ 'layout.minishippane', `info.fleets.${fleetId}.api_ship` ]}>
      {
        (shipsId || []).map((shipId, i) =>
          <MiniShipRow
            key={shipId}
            shipId={shipId}
            enableAvatar={enableAvatar}
            compact={width < 240}
          />
        )
      }
    </ScrollShadow>
  </>
)

export const LBViewMini = translate(['resources'])(connect(state => ({
  areaIds: get(state, 'info.airbase', []).map(a => a.api_area_id),
  mapareas: get(state, 'const.$mapareas', {}),
}))(({ areaIds, mapareas, t }) => (
  <ScrollShadow className="ship-details-mini" observerPath={[ 'layout.minishippane', 'info.airbase' ]}>
    {
      areaIds.map((id, i) => (
        mapareas[id] != null && (
          id === areaIds[i - 1] ?
            <MiniSquardRow
              key={i}
              squardId={i}
            /> :
            <div key={i}>
              <Alert style={{ color: window.isDarkTheme ? '#FFF' : '#000' }} className='airbase-area'>
                [{id}] {mapareas[id] ? t(`resources:${ mapareas[id].api_name }`) : ''}
              </Alert>
              <MiniSquardRow
                key={i}
                squardId={i}
              />
            </div>
        )
      ))
    }
  </ScrollShadow>
)))
