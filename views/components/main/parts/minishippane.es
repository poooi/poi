import { connect } from 'react-redux'
import { MiniShipRow, MiniSquardRow } from './minishipitem'
import React, { Fragment } from 'react'
import { get } from 'lodash'
import { Alert } from 'react-bootstrap'

import TopAlert from 'views/components/ship-parts/topalert'
import { fleetShipsIdSelectorFactory } from 'views/utils/selectors'

export const PaneBodyMini = connect(() => {
  return (state, {fleetId}) => ({
    shipsId: fleetShipsIdSelectorFactory(fleetId)(state),
  })
}
)(({fleetId, shipsId}) =>
  <Fragment>
    <div className='fleet-name'>
      <TopAlert
        fleetId={fleetId}
        isMini={true}
      />
    </div>
    <div className={"ship-details-mini"}>
      {
        (shipsId || []).map((shipId, i) =>
          <MiniShipRow
            key={shipId}
            shipId={shipId}
          />
        )
      }
    </div>
  </Fragment>
)

export const LBViewMini = connect(state => ({
  areaIds: get(state, 'info.airbase', []).map(a => a.api_area_id),
  mapareas: get(state, 'const.$mapareas', {}),
}))(({areaIds, mapareas}) => (
  <div className="ship-details-mini">
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
              [{id}] {window.i18n.resources.__((mapareas[id] || {}).api_name || '')}
              </Alert>
              <MiniSquardRow
                key={i}
                squardId={i}
              />
            </div>
        )
      ))
    }
  </div>
)
)
