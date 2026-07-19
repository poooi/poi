import type { RootState } from 'views/redux/reducer-factory'

import { Intent, Position, Tag, Tooltip } from '@blueprintjs/core'
import { isFinite } from 'lodash'
import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import { ShipLabel } from 'views/components/ship-parts/styled-components'
import { getShipAAPB } from 'views/utils/combat/aapb'
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
        (shipPair, _equips = []) => {
          if (!shipPair) return 0
          const [_ship, $ship] = shipPair
          const ship = { ...$ship, ..._ship }
          const equips = _equips
            .filter((e): e is NonNullable<typeof e> => !!(e && e[0] && e[1]))
            .map((e) => {
              const [_e, $e] = e
              return { ...$e, ..._e }
            })
          return getShipAAPB(ship, equips)
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
