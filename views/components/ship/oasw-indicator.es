import React from 'react'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { memoize } from 'lodash'
import { Label } from 'react-bootstrap'

import { shipDataSelectorFactory, shipEquipDataSelectorFactory } from 'views/utils/selectors'
import { isOASW } from 'views/utils/oasw'

const { i18n } = window
const __ = i18n.main.__.bind(i18n.main)

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


const OASWIndicator = connect(
  (state, { shipId }) => ({
    isOASW: OASWSelectorFactory(shipId)(state),
  })
)(({ isOASW, shipId }) => (
  isOASW ?
  <span className="ship-oasw">
    <Label bsStyle='primary'>{__('OASW')}</Label>
  </span>
  : <noscript />
))

export default OASWIndicator
