import { Tag, ProgressBar, Tooltip, Position } from '@blueprintjs/core'
import memoize from 'fast-memoize'
import { get } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import {
  ShipItem,
  ShipAvatar,
  LBACName,
  LBACRange,
  LBACFP,
  ShipHP,
  ShipStatusContainer,
  ShipHPProgress,
  ShipSlot,
  Gradient,
} from 'views/components/ship-parts/styled-components'
import {
  getHpStyle,
  getTyku,
  LBAC_INTENTS,
  LBAC_STATUS_NAMES,
  LBAC_STATUS_AVATAR_COLOR,
} from 'views/utils/game-utils'
import { landbaseSelectorFactory, landbaseEquipDataSelectorFactory } from 'views/utils/selectors'

import { LandbaseSlotitems } from './slotitems'

interface EquipData {
  [key: string]: unknown
}

interface Landbase {
  api_action_kind: number
  api_distance: {
    api_base: number
    api_bonus: number
  }
  api_name: string
  api_nowhp?: number
  api_maxhp?: number
  [key: string]: unknown
}

interface SquadSelectorProps {
  squardId: number
}

interface SquadStateProps {
  landbase: Landbase
  equipsData: EquipData[]
  squardId: number
}

interface SquadRowProps extends SquadSelectorProps {
  enableAvatar: boolean
  compact: boolean
}

const SquadSelectorFactory = memoize((squardId: number) =>
  createSelector(
    [landbaseSelectorFactory(squardId), landbaseEquipDataSelectorFactory(squardId)],
    (landbase: Landbase | undefined, equipsData: EquipData[] | undefined): SquadStateProps => ({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      landbase: landbase ?? ({} as Landbase),
      equipsData: equipsData ?? [],
      squardId,
    }),
  ),
)

const SquadRowComponent: React.FC<SquadRowProps & SquadStateProps> = ({
  landbase,
  equipsData,
  squardId,
  enableAvatar,
  compact,
}) => {
  const { t } = useTranslation(['main'])

  const { api_action_kind, api_distance, api_name, api_nowhp = 200, api_maxhp = 200 } = landbase

  const { api_base = 0, api_bonus = 0 } = api_distance || {}
  const tyku = getTyku([equipsData], api_action_kind)
  const hpPercentage = (api_nowhp / api_maxhp) * 100
  const hideLBACName = enableAvatar && compact

  return (
    <Tooltip
      position={Position.TOP}
      disabled={!hideLBACName}
      wrapperTagName="div"
      targetTagName="div"
      content={
        <div className="ship-tooltip-info">
          <div>{api_name}</div>
          <div>
            {t('main:Range')}: {api_base + api_bonus}
            {!!api_bonus && ` (${api_base} + ${api_bonus})`}
          </div>
          <div>
            {t('main:Fighter Power')}:{' '}
            {tyku.max === tyku.min ? tyku.min : tyku.min + ' ~ ' + tyku.max}
          </div>
        </div>
      }
    >
      <ShipItem className="ship-item" avatar={enableAvatar} shipName={!hideLBACName} isLBAC>
        {enableAvatar && !!get(equipsData, '0.0.api_slotitem_id') && (
          <>
            <ShipAvatar
              type="equip"
              mstId={get(equipsData, '0.0.api_slotitem_id')}
              height={58}
              useDefaultBG={false}
              useFixedWidth={false}
            />
            <Gradient color={LBAC_STATUS_AVATAR_COLOR[api_action_kind]} />
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
              {tyku.max === tyku.min ? tyku.min : tyku.min + ' ~ ' + tyku.max}
            </LBACFP>
          </>
        )}
        <ShipHP className="ship-hp" shipName={!hideLBACName}>
          {api_nowhp} / {api_maxhp}
        </ShipHP>
        <ShipStatusContainer className="lbac-status-label">
          <Tag className="landbase-status" minimal intent={LBAC_INTENTS[api_action_kind]}>
            {t(LBAC_STATUS_NAMES[api_action_kind])}
          </Tag>
        </ShipStatusContainer>
        <ShipHPProgress className="hp-progress" shipName={!hideLBACName}>
          <ProgressBar
            stripes={false}
            intent={getHpStyle(hpPercentage)}
            value={hpPercentage / 100}
          />
        </ShipHPProgress>
        <ShipSlot className="ship-slot">
          <LandbaseSlotitems landbaseId={squardId} isMini={false} />
        </ShipSlot>
      </ShipItem>
    </Tooltip>
  )
}

const mapStateToProps = (state: unknown, ownProps: SquadSelectorProps): SquadStateProps => ({
  ...SquadSelectorFactory(ownProps.squardId)(state),
})

export const SquardRow = connect(mapStateToProps)(SquadRowComponent)
