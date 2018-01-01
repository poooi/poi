import { connect } from 'react-redux'
import { MiniShipRow, MiniSquardRow } from './minishipitem'
import React, { Fragment } from 'react'
import { get } from 'lodash'
import { Alert } from 'react-bootstrap'
import { createSelector } from 'reselect'

import TopAlert from 'views/components/ship-parts/topalert'
import { fleetShipsIdSelectorFactory, layoutSelector, configLayoutSelector, configDoubleTabbedSelector } from 'views/utils/selectors'

const miniShipRowWidthSelector = createSelector(
  [
    layoutSelector,
    configLayoutSelector,
    configDoubleTabbedSelector,
  ], ({ webview, window }, layout, doubleTabbed) => {
    if (layout === 'horizontal') {
      if (doubleTabbed) {
        return ((window.width - webview.width) / 4) - 16
      }
      return ((window.width - webview.width) / 2) - 16
    }
    if (doubleTabbed) {
      return (window.width / 4) - 16
    }
    return (window.width * 0.4) - 16
  }
)

export const PaneBodyMini = connect(() => {
  return (state, {fleetId}) => ({
    shipsId: fleetShipsIdSelectorFactory(fleetId)(state),
    enableAvatar: get(state, 'config.poi.enableAvatar', true),
    width: miniShipRowWidthSelector(state),
  })
})(({ fleetId, shipsId, enableAvatar, width }) =>
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
            enableAvatar={enableAvatar}
            compact={width < 240}
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
