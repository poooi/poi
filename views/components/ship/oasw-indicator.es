import React from 'react'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { memoize } from 'lodash'
import { Tag, Intent } from '@blueprintjs/core'

import { shipDataSelectorFactory, shipEquipDataSelectorFactory } from 'views/utils/selectors'
import { isOASW } from 'views/utils/oasw'
import { withNamespaces } from 'react-i18next'
import { ShipLabel } from 'views/components/ship-parts/styled-components'

const OASWSelectorFactory = memoize((shipId) =>
  createSelector(
    [shipDataSelectorFactory(shipId), shipEquipDataSelectorFactory(shipId)],
    ([_ship = {}, $ship = {}] = [], _equips = []) => {
      const ship = { ...$ship, ..._ship }
      const equips = _equips
        .filter(([_equip, $equip, onslot] = []) => !!_equip && !!$equip)
        .map(([_equip, $equip, onslot]) => ({ ...$equip, ..._equip }))

      return isOASW(ship, equips)
    },
  ),
)

export const OASWIndicator = withNamespaces(['main'])(
  connect((state, { shipId }) => ({
    isOASW: OASWSelectorFactory(shipId)(state),
  }))(
    ({ isOASW, shipId, t }) =>
      isOASW && (
        <ShipLabel className="ship-skill-indicator ship-oasw" isTag>
          <Tag minimal intent={Intent.PRIMARY}>
            {t('main:OASW')}
          </Tag>
        </ShipLabel>
      ),
  ),
)
