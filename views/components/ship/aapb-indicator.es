import React from 'react'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { memoize } from 'lodash'
import { OverlayTrigger, Tooltip, Label } from 'react-bootstrap'
import { translate } from 'react-i18next'

import { shipDataSelectorFactory, shipEquipDataSelectorFactory } from 'views/utils/selectors'
import { getShipAAPB } from 'views/utils/aapb'

const AAPBSelectorFactory = memoize(shipId =>
  createSelector([
    shipDataSelectorFactory(shipId),
    shipEquipDataSelectorFactory(shipId),
  ], ([_ship = {}, $ship = {}] = [], _equips = []) => {
    const ship = { ...$ship, ..._ship }
    const equips = _equips.filter(([_equip, $equip, onslot] = []) => !!_equip && !!$equip)
      .map(([_equip, $equip, onslot]) => ({ ...$equip, ..._equip }))
    return getShipAAPB(ship, equips)
  })
)

export const AAPBIndicator = translate(['main'])(connect(
  (state, { shipId }) => ({
    AAPB: AAPBSelectorFactory(shipId)(state) || 0,
  })
)(({ AAPB, shipId, t }) => {
  const tooltip = AAPB > 0 && <span>{`${AAPB}%`}</span>

  return(
    AAPB > 0 ?
      <span className="ship-aapb">
        <OverlayTrigger placement="top" overlay={<Tooltip className="info-tooltip" id={`aapb-info-${shipId}`}>{tooltip}</Tooltip>}>
          <Label bsStyle='warning'>{t('main:AAPB')}</Label>
        </OverlayTrigger>
      </span>
      : <span />
  )
}))

