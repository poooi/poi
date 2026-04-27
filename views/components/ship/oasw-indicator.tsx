import type { RootState } from 'views/redux/reducer-factory'

import { Intent, Tag } from '@blueprintjs/core'
import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import { ShipLabel } from 'views/components/ship-parts/styled-components'
import { isOASW } from 'views/utils/oasw'
import { shipDataSelectorFactory, shipEquipDataSelectorFactory } from 'views/utils/selectors'

interface OASWIndicatorProps {
  shipId: number
}

export const OASWIndicator = memo(({ shipId }: OASWIndicatorProps) => {
  const { t } = useTranslation('main')
  const selector = useMemo(
    () =>
      createSelector(
        [shipDataSelectorFactory(shipId), shipEquipDataSelectorFactory(shipId)],
        (shipPair, _equips = []) => {
          if (!shipPair) return false
          const [_ship, $ship] = shipPair
          const ship = { ...$ship, ..._ship }
          const equips = _equips
            .filter((e): e is NonNullable<typeof e> => !!(e && e[0] && e[1]))
            .map((e) => {
              const [_e, $e] = e
              return { ...$e, ..._e }
            })
          return isOASW(ship, equips)
        },
      ),
    [shipId],
  )
  const oasw = useSelector((state: RootState) => selector(state))

  return oasw ? (
    <ShipLabel className="ship-skill-indicator ship-oasw" isTag>
      <Tag minimal intent={Intent.PRIMARY}>
        {t('main:OASW')}
      </Tag>
    </ShipLabel>
  ) : null
})
OASWIndicator.displayName = 'OASWIndicator'
