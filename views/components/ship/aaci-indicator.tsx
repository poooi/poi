import type { RootState } from 'views/redux/reducer-factory'

import { Intent, Position, Tag, Tooltip } from '@blueprintjs/core'
import React, { memo, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import {
  InfoTooltip,
  InfoTooltipEntry,
  InfoTooltipItem,
} from 'views/components/etc/styled-components'
import { AACITypeName, ShipLabel } from 'views/components/ship-parts/styled-components'
import i18next from 'views/env-parts/i18next'
import { AACITable, getShipAACIs, getShipAllAACIs } from 'views/utils/aaci'
import { shipDataSelectorFactory, shipEquipDataSelectorFactory } from 'views/utils/selectors'

const getAvailableTranslation = (str: string) =>
  i18next.exists(`main:${str}`) ? (
    <Trans>main:{str}</Trans>
  ) : i18next.exists(`resources:${str}`) ? (
    <Trans>resources:{str}</Trans>
  ) : (
    str
  )

const renderAACINames = (name: string[]) =>
  name.map((n, i) => (
    <AACITypeName className="aaci-type-name" key={i}>
      {getAvailableTranslation(n)}
    </AACITypeName>
  ))

interface AACIIndicatorProps {
  shipId: number
}

export const AACIIndicator = memo(({ shipId }: AACIIndicatorProps) => {
  const { t } = useTranslation('main')

  const aaciSelector = useMemo(
    () =>
      createSelector(
        [shipDataSelectorFactory(shipId), shipEquipDataSelectorFactory(shipId)],
        (shipPair, _equips = []) => {
          if (!shipPair) return []
          const [_ship, $ship] = shipPair
          const ship = { ...$ship, ..._ship }
          const equips = _equips
            .filter((e): e is NonNullable<typeof e> => !!(e && e[0] && e[1]))
            .map((e) => {
              const [_e, $e] = e
              return { ...$e, ..._e }
            })
          return getShipAACIs(ship, equips)
        },
      ),
    [shipId],
  )

  const maxShotdownSelector = useMemo(
    () =>
      createSelector([shipDataSelectorFactory(shipId)], (shipPair) => {
        if (!shipPair) return 0
        const [_ship, $ship] = shipPair
        const AACIs = getShipAllAACIs({ ...$ship, ..._ship })
        return Math.max(...AACIs.map((id) => AACITable[id]?.fixed ?? 0))
      }),
    [shipId],
  )

  const AACIs = useSelector((state: RootState) => aaciSelector(state) ?? [])
  const maxShotdown = useSelector((state: RootState) => maxShotdownSelector(state))

  if (!AACIs.length) return null

  const currentMax = Math.max(...AACIs.map((id) => AACITable[id]?.fixed ?? 0))

  const tooltip = (
    <InfoTooltip className="info-tooltip">
      {AACIs.map((id) => (
        <InfoTooltipEntry className="info-tooltip-entry" key={id}>
          <InfoTooltipItem className="info-tooltip-item">
            {t('main:AACIType', { count: id })}
            <span>{AACITable?.[id]?.name?.length ? renderAACINames(AACITable[id].name) : ''}</span>
          </InfoTooltipItem>
          <span>{t('main:Shot down', { count: AACITable[id].fixed })}</span>
          <span style={{ marginLeft: '2ex' }}>
            {t('main:Modifier', { count: AACITable[id].modifier })}
          </span>
        </InfoTooltipEntry>
      ))}
      {currentMax < maxShotdown && <span>{t('main:Max shot down not reached')}</span>}
    </InfoTooltip>
  )

  return (
    <ShipLabel className="ship-skill-indicator ship-aaci" isTag>
      <Tooltip position={Position.TOP} content={tooltip}>
        <Tag minimal intent={Intent.WARNING}>
          {t('main:AACI')}
        </Tag>
      </Tooltip>
    </ShipLabel>
  )
})
AACIIndicator.displayName = 'AACIIndicator'
