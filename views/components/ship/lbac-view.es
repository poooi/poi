import React from 'react'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import {
  getHpStyle,
  getTyku,
  LBAC_INTENTS,
  LBAC_STATUS_NAMES,
  LBAC_STATUS_AVATAR_COLOR,
} from 'views/utils/game-utils'
import { LandbaseSlotitems } from './slotitems'
import { landbaseSelectorFactory, landbaseEquipDataSelectorFactory } from 'views/utils/selectors'
import { withNamespaces } from 'react-i18next'
import { get } from 'lodash'
import { Tag, ProgressBar, Tooltip, Position } from '@blueprintjs/core'
import { compose } from 'redux'
import memoize from 'fast-memoize'
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

const SquadSelectorFactory = memoize(squardId =>
  createSelector(
    [landbaseSelectorFactory(squardId), landbaseEquipDataSelectorFactory(squardId)],
    (landbase, equipsData) => ({
      landbase,
      equipsData,
      squardId,
    }),
  ),
)

export const SquardRow = compose(
  withNamespaces(['main']),
  connect((state, { squardId }) => SquadSelectorFactory(squardId)),
)(({ landbase, equipsData, squardId, t, enableAvatar, compact }) => {
  const { api_action_kind, api_distance, api_name, api_nowhp = 200, api_maxhp = 200 } = landbase
  const { api_base, api_bonus } = api_distance
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
})
