import React from 'react'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { memoize } from 'lodash'
import { Label } from 'react-bootstrap'

import { shipDataSelectorFactory, shipEquipDataSelectorFactory } from 'views/utils/selectors'
import { isOASW } from 'views/utils/oasw'
import { translate } from 'react-i18next'

const OASWSelectorFactory = memoize(shipId =>
  createSelector([
    shipDataSelectorFactory(shipId),
    shipEquipDataSelectorFactory(shipId),
  ], ([_ship = {}, $ship = {}] = [], _equips = []) => {
    const ship = { ...$ship, ..._ship }
    const equips = _equips.filter(([_equip, $equip, onslot] = []) => !!_equip && !!$equip)
      .map(([_equip, $equip, onslot]) => ({ ...$equip, ..._equip }))

    return isOASW(ship, equips)
  })
)


export const OASWIndicator = translate(['main'])(connect(
  (state, { shipId }) => ({
    isOASW: OASWSelectorFactory(shipId)(state),
  })
)(({ isOASW, shipId, t }) => (
  isOASW ?
    <span className="ship-oasw">
      <Label bsStyle='primary'>{t('main:OASW')}</Label>
    </span>
    : <span />
)))
