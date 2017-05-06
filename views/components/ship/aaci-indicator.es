import React from 'react'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { memoize, get } from 'lodash'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

import { shipDataSelectorFactory, shipEquipDataSelectorFactory } from 'views/utils/selectors'
import { getShipAACIs, AACITable } from 'views/utils/aaci'

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

const AACIIndicator = connect(
  (state, { shipId }) => ({
    AACIs: AACISelectorFactory(shipId)(state) || [],
  })
)(({ AACIs, shipId }) => {

  const tooltip =
  (
    <div>
      {
        AACIs.map(id =>
          <div className="info-tooltip-entry" key={id}>
            <span className="info-tooltip-item">
              {__('Type %s', id)}{get(AACITable, `${id}.name.length`, 0) > 0 ? ` - ${__(AACITable[id].name)}` : ''}
            </span>
            <span>
              {__('Shot down: %s', AACITable[id].fixed)}
            </span>
          </div>
        )
      }
    </div>
  )

  return(
    <span className="ship-aaci">
      {
        AACIs.length ?
          <OverlayTrigger placement="top" overlay={<Tooltip className="info-tooltip" id={`aaci-info-${shipId}`}>{tooltip}</Tooltip>}>
            <span>{__('AACI')}</span>
          </OverlayTrigger>
        :
          ''
      }
    </span>
  )
})

export default AACIIndicator
