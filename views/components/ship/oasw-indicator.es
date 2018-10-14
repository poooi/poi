import React from 'react'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { memoize } from 'lodash'
import { Tag, Intent } from '@blueprintjs/core'

import {
  shipDataSelectorFactory, shipEquipDataSelectorFactory,
  allCVEIdsSelector,
} from 'views/utils/selectors'
import { isOASWWith } from 'views/utils/oasw'
import { translate } from 'react-i18next'
import { ShipLabel } from './styled-components'

const isOASWFuncSelector = createSelector(
  allCVEIdsSelector,
  allCVEIds => isOASWWith(allCVEIds)
)

const OASWSelectorFactory = memoize(shipId =>
  createSelector([
    isOASWFuncSelector,
    shipDataSelectorFactory(shipId),
    shipEquipDataSelectorFactory(shipId),
  ], (isOASW, [_ship = {}, $ship = {}] = [], _equips = []) => {
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
  isOASW &&
    <ShipLabel className="ship-skill-indicator ship-oasw" isTag>
      <Tag minimal intent={Intent.PRIMARY}>{t('main:OASW')}</Tag>
    </ShipLabel>
)))
