import type { RootState } from 'views/redux/reducer-factory'

import { Intent, Position, Tag, Tooltip } from '@blueprintjs/core'
import { compact, isFinite } from 'lodash'
import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import { ShipLabel } from 'views/components/ship-parts/styled-components'
import { getShipAAPB } from 'views/utils/aapb'
import { shipDataSelectorFactory, shipEquipDataSelectorFactory } from 'views/utils/selectors'

interface AAPBIndicatorProps {
  shipId: number
}

export const AAPBIndicator = memo(({ shipId }: AAPBIndicatorProps) => {
  const { t } = useTranslation('main')
  const selector = useMemo(
    () =>
      createSelector(
        [shipDataSelectorFactory(shipId), shipEquipDataSelectorFactory(shipId)],
        (shipInfo, equipsInfo) => {
          if (!shipInfo || !equipsInfo) return 0
          return getShipAAPB(shipInfo, compact(equipsInfo))
        },
      ),
    [shipId],
  )
  const AAPB = useSelector((state: RootState) => selector(state) ?? 0)

  return isFinite(AAPB) && AAPB > 0 ? (
    <ShipLabel className="ship-skill-indicator ship-aapb" isTag>
      <Tooltip position={Position.TOP} content={<span>{`${AAPB.toFixed(2)}%`}</span>}>
        <Tag minimal intent={Intent.WARNING}>
          {t('main:AAPB')}
        </Tag>
      </Tooltip>
    </ShipLabel>
  ) : null
})
AAPBIndicator.displayName = 'AAPBIndicator'
