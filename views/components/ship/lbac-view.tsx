import type { Intent } from '@blueprintjs/core'
import type { RootState } from 'views/redux/reducer-factory'

import { Position, ProgressBar, Tag, Tooltip } from '@blueprintjs/core'
import memoize from 'fast-memoize'
import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import {
  Gradient,
  LBACFP,
  LBACName,
  LBACRange,
  ShipAvatar,
  ShipHP,
  ShipHPProgress,
  ShipItem,
  ShipSlot,
  ShipStatusContainer,
} from 'views/components/ship-parts/styled-components'
import {
  getHpStyle,
  getTyku,
  LBAC_INTENTS,
  LBAC_STATUS_AVATAR_COLOR,
  LBAC_STATUS_NAMES,
} from 'views/utils/game-utils'
import { landbaseEquipDataSelectorFactory, landbaseSelectorFactory } from 'views/utils/selectors'

import { LandbaseSlotitems } from './slotitems'

const SquadSelectorFactory = memoize((squardId: number) =>
  createSelector(
    [landbaseSelectorFactory(squardId), landbaseEquipDataSelectorFactory(squardId)],
    (landbase, equipsData) => ({ landbase, equipsData }),
  ),
)

interface SquardRowProps {
  squardId: number
  enableAvatar?: boolean
  compact?: boolean
}

export const SquardRow = memo(({ squardId, enableAvatar, compact }: SquardRowProps) => {
  const { t } = useTranslation('main')
  const selector = useMemo(() => SquadSelectorFactory(squardId), [squardId])
  const { landbase, equipsData } = useSelector((state: RootState) => selector(state))

  const {
    api_action_kind = 0,
    api_distance,
    api_name = '',
    api_nowhp = 200,
    api_maxhp = 200,
  } = landbase ?? {}
  const { api_base = 0, api_bonus = 0 } = api_distance ?? {}
  const tyku = getTyku([equipsData!], api_action_kind)
  const hpPercentage = (api_nowhp / api_maxhp) * 100
  const hideLBACName = enableAvatar && compact

  return (
    <Tooltip
      position={Position.TOP}
      disabled={!hideLBACName}
      content={
        <div className="ship-tooltip-info">
          <div>{api_name}</div>
          <div>
            {t('main:Range')}: {api_base + api_bonus}
            {!!api_bonus && ` (${api_base} + ${api_bonus})`}
          </div>
          <div>
            {t('main:Fighter Power')}:{' '}
            {tyku.max === tyku.min ? tyku.min : `${tyku.min} ~ ${tyku.max}`}
          </div>
        </div>
      }
    >
      <ShipItem className="ship-item" avatar={enableAvatar} shipName={!hideLBACName} isLBAC>
        {enableAvatar && !!equipsData?.[0]?.[0]?.api_slotitem_id && (
          <>
            <ShipAvatar
              type="equip"
              mstId={equipsData?.[0]?.[0]?.api_slotitem_id}
              height={58}
              useDefaultBG={false}
              useFixedWidth={false}
            />
            <Gradient color={LBAC_STATUS_AVATAR_COLOR[api_action_kind] ?? ''} />
          </>
        )}
        {!hideLBACName && (
          <>
            <LBACName className="ship-name" avatar={enableAvatar}>
              {api_name}
            </LBACName>
            <LBACRange className="ship-lv" avatar={enableAvatar}>
              {t('main:Range')}: {api_base + api_bonus}
              {!!api_bonus && ` (${api_base} + ${api_bonus})`}
            </LBACRange>
            <LBACFP className="ship-lv" avatar={enableAvatar}>
              {t('main:Fighter Power')}:{' '}
              {tyku.max === tyku.min ? tyku.min : `${tyku.min} ~ ${tyku.max}`}
            </LBACFP>
          </>
        )}
        <ShipHP className="ship-hp">
          {api_nowhp} / {api_maxhp}
        </ShipHP>
        <ShipStatusContainer className="lbac-status-label">
          <Tag className="landbase-status" minimal intent={LBAC_INTENTS[api_action_kind] as Intent}>
            {t(LBAC_STATUS_NAMES[api_action_kind])}
          </Tag>
        </ShipStatusContainer>
        <ShipHPProgress className="hp-progress">
          <ProgressBar
            stripes={false}
            // Custom Intent type is not assignable to Intent, but the value is guaranteed to be valid
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            intent={getHpStyle(hpPercentage) as Intent}
            value={hpPercentage / 100}
          />
        </ShipHPProgress>
        <ShipSlot className="ship-slot">
          <LandbaseSlotitems landbaseId={squardId} isMini={false} />
        </ShipSlot>
      </ShipItem>
    </Tooltip>
  )
})
SquardRow.displayName = 'SquardRow'
