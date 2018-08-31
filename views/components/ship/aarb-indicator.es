import React from 'react'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { memoize } from 'lodash'
import { OverlayTrigger, Tooltip, Label } from 'react-bootstrap'
import { translate } from 'react-i18next'

import { shipDataSelectorFactory, shipEquipDataSelectorFactory } from 'views/utils/selectors'
import { getShipAARB } from 'views/utils/aarb'

const AARBSelectorFactory = memoize(shipId =>
  createSelector([
    shipDataSelectorFactory(shipId),
    shipEquipDataSelectorFactory(shipId),
  ], ([_ship = {}, $ship = {}] = [], _equips = []) => {
    const ship = { ...$ship, ..._ship }
    const equips = _equips.filter(([_equip, $equip, onslot] = []) => !!_equip && !!$equip)
      .map(([_equip, $equip, onslot]) => ({ ...$equip, ..._equip }))
    return getShipAARB(ship, equips)
  })
)

export const AARBIndicator = translate(['main'])(connect(
  (state, { shipId }) => ({
    AARB: AARBSelectorFactory(shipId)(state) || 0,
  })
)(({ AARB, shipId, t }) => {
  const tooltip = AARB > 0 && <span>{`${AARB}%`}</span>

  return(
    AARB > 0 ?
      <span className="ship-aarb">
        <OverlayTrigger placement="top" overlay={<Tooltip className="info-tooltip" id={`aarb-info-${shipId}`}>{tooltip}</Tooltip>}>
          <Label bsStyle='warning'>{t('main:AARB')}</Label>
        </OverlayTrigger>
      </span>
      : <span />
  )
}))

