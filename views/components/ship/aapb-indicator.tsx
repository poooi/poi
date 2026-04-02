import { Tag, Intent, Position, Tooltip } from '@blueprintjs/core'
import { compact, isFinite, memoize } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { ShipLabel } from 'views/components/ship-parts/styled-components'
import { getShipAAPB } from 'views/utils/aapb'
import { shipDataSelectorFactory, shipEquipDataSelectorFactory } from 'views/utils/selectors'

interface ShipInfo {
  [key: string]: unknown
}

interface EquipInfo {
  [key: string]: unknown
}

interface AAPBSelectorProps {
  shipId: number
}

interface AAPBStateProps {
  AAPB: number
}

interface AAPBIndicatorProps extends AAPBSelectorProps, AAPBStateProps {}

const AAPBSelectorFactory = memoize((shipId: number) =>
  createSelector(
    [shipDataSelectorFactory(shipId), shipEquipDataSelectorFactory(shipId)],
    (shipInfo: [ShipInfo, ShipInfo] | undefined, equipsInfo: (EquipInfo[] | undefined)[]) => {
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

const AAPBIndicatorComponent: React.FC<AAPBIndicatorProps> = ({ AAPB }) => {
  const { t } = useTranslation(['main'])

  if (!isFinite(AAPB) || AAPB <= 0) {
    return null
  }

  return (
    <ShipLabel className="ship-skill-indicator ship-aapb" isTag>
      <Tooltip position={Position.TOP} content={<span>{`${AAPB.toFixed(2)}%`}</span>}>
        <Tag minimal intent={Intent.WARNING}>
          {t('main:AAPB')}
        </Tag>
      </Tooltip>
    </ShipLabel>
  )
}

const mapStateToProps = (state: unknown, ownProps: AAPBSelectorProps): AAPBStateProps => ({
  AAPB: AAPBSelectorFactory(ownProps.shipId)(state) || 0,
})

export const AAPBIndicator = connect(mapStateToProps)(AAPBIndicatorComponent)
