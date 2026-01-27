import { Tag, Intent } from '@blueprintjs/core'
import { memoize } from 'lodash'
import React from 'react'
import { withNamespaces } from 'react-i18next'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { ShipLabel } from 'views/components/ship-parts/styled-components'
import { isOASW } from 'views/utils/oasw'
import { shipDataSelectorFactory, shipEquipDataSelectorFactory } from 'views/utils/selectors'

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
