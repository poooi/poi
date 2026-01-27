import { Tooltip, Tag, Position, Intent } from '@blueprintjs/core'
import { memoize, compact, isFinite } from 'lodash'
import React from 'react'
import { withNamespaces } from 'react-i18next'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { createSelector } from 'reselect'
import { ShipLabel } from 'views/components/ship-parts/styled-components'
import { getShipAAPB } from 'views/utils/aapb'
import { shipDataSelectorFactory, shipEquipDataSelectorFactory } from 'views/utils/selectors'

const AAPBSelectorFactory = memoize((shipId) =>
  createSelector(
    [shipDataSelectorFactory(shipId), shipEquipDataSelectorFactory(shipId)],
    (shipInfo, equipsInfo) => {
      if (!shipInfo || !equipsInfo) return 0
      /*
     equipment position is irrelevant with regard to AAPB trigger rate,
     so we might as well remove all `undefined` for getShipAAPB to
     have a uniform structure to work with.
   */
      return getShipAAPB(shipInfo, compact(equipsInfo))
    },
  ),
)

export const AAPBIndicator = compose(
  withNamespaces(['main']),
  connect((state, { shipId }) => ({
    AAPB: AAPBSelectorFactory(shipId)(state) || 0,
  })),
)(
  ({ AAPB, shipId, t }) =>
    isFinite(AAPB) &&
    AAPB > 0 && (
      <ShipLabel className="ship-skill-indicator ship-aapb" isTag>
        <Tooltip position={Position.TOP} content={<span>{`${AAPB.toFixed(2)}%`}</span>}>
          <Tag minimal intent={Intent.WARNING}>
            {t('main:AAPB')}
          </Tag>
        </Tooltip>
      </ShipLabel>
    ),
)
