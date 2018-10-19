import React from 'react'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { memoize, compact, isFinite } from 'lodash'
import { OverlayTrigger, Tooltip, Label } from 'react-bootstrap'
import { translate } from 'react-i18next'

import { shipDataSelectorFactory, shipEquipDataSelectorFactory } from 'views/utils/selectors'
import { getShipAAPB } from 'views/utils/aapb'

const AAPBSelectorFactory = memoize(shipId =>
  createSelector([
    shipDataSelectorFactory(shipId),
    shipEquipDataSelectorFactory(shipId),
  ], (shipInfo, equipsInfo) => {
    if (!shipInfo || !equipsInfo)
      return 0
    /*
       equipment position is irrelevant with regard to AAPB trigger rate,
       so we might as well remove all `undefined` for getShipAAPB to
       have a uniform structure to work with.
     */
    return getShipAAPB(shipInfo, compact(equipsInfo))
  })
)

export const AAPBIndicator = translate(['main'])(connect(
  (state, { shipId }) => ({
    AAPB: AAPBSelectorFactory(shipId)(state),
  })
)(({ AAPB, shipId, t }) =>
  (isFinite(AAPB) && AAPB > 0) ? (
    <span className="ship-aapb">
      <OverlayTrigger
        placement="top"
        overlay={
          (
            <Tooltip
              className="info-tooltip"
              id={`aapb-info-${shipId}`}
            >
              <span>{`${AAPB.toFixed(2)}%`}</span>
            </Tooltip>
          )
        }>
        <Label bsStyle="warning">{t('main:AAPB')}</Label>
      </OverlayTrigger>
    </span>
  ) : (<span />)
))
