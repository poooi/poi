import React from 'react'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { memoize, get } from 'lodash'
import { OverlayTrigger, Tooltip, Label } from 'react-bootstrap'

import { shipDataSelectorFactory, shipEquipDataSelectorFactory } from 'views/utils/selectors'
import { getShipAACIs, getShipAllAACIs, AACITable } from 'views/utils/aaci'

const { i18n } = window
const __ = i18n.main.__.bind(i18n.main)

const AACISelectorFactory = memoize(shipId =>
  createSelector([
    shipDataSelectorFactory(shipId),
    shipEquipDataSelectorFactory(shipId),
  ], ([_ship = {}, $ship = {}] = [], _equips = []) => {
    const ship = { ...$ship, ..._ship }
    const equips = _equips.filter(([_equip, $equip, onslot] = []) => !!_equip && !!$equip)
                          .map(([_equip, $equip, onslot]) => ({ ...$equip, ..._equip }))

    return getShipAACIs(ship, equips)
  })
)

const maxAACIShotdownSelectorFactory = memoize(shipId =>
  createSelector([
    shipDataSelectorFactory(shipId),
  ], ([_ship = {}, $ship = {}] = []) => {
    const AACIs = getShipAllAACIs({ ...$ship, ..._ship })
    return Math.max(...AACIs.map(id => AACITable[id].fixed || 0))
  })
)

const AACIIndicator = connect(
  (state, { shipId }) => ({
    AACIs: AACISelectorFactory(shipId)(state) || [],
    maxShotdown: maxAACIShotdownSelectorFactory(shipId)(state),
  })
)(({ AACIs, maxShotdown, shipId }) => {
  const currentMax = Math.max(...AACIs.map(id => AACITable[id].fixed || 0))

  const tooltip = AACIs.length &&
  (
    <div>
      {
        AACIs.map(id =>
          <div className="info-tooltip-entry" key={id}>
            <span className="info-tooltip-item">
              {__('Type %s', id)}{get(AACITable, `${id}.name.length`, 0) > 0 ? ` - ${__(i18n.resources.__(AACITable[id].name))}` : ''}
            </span>
            <span>
              {__('Shot down: %s', AACITable[id].fixed)}
            </span>
          </div>
        )
      }
      {
        currentMax < maxShotdown && <span>{__('Max shot down not reached')}</span>
      }
    </div>
  )

  return(
    AACIs.length ?
    <span className="ship-aaci">
      <OverlayTrigger placement="top" overlay={<Tooltip className="info-tooltip" id={`aaci-info-${shipId}`}>{tooltip}</Tooltip>}>
        <Label bsStyle='warning'>{__('AACI')}</Label>
      </OverlayTrigger>
    </span>
    : <noscript />
  )
})

export default AACIIndicator
