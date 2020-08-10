import React from 'react'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { getHpStyle, getTyku, LBAC_INTENTS, LBAC_STATUS_NAMES } from 'views/utils/game-utils'
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
  ShipInfo,
  ShipHPTextRow,
  ShipSubText,
  ShipName,
  LandBaseStat,
  ShipHP,
  ShipSlot,
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
  const hideShipName = enableAvatar && compact
  return (
    <Tooltip
      position={Position.TOP}
      disabled={!hideShipName}
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
      <ShipItem className="ship-item">
        {enableAvatar && !!get(equipsData, '0.0.api_slotitem_id') && (
          <ShipAvatar type="equip" mstId={get(equipsData, '0.0.api_slotitem_id')} height={54} />
        )}
        <ShipInfo className="ship-info lbac-info" avatar={enableAvatar} show={!hideShipName}>
          {!hideShipName && (
            <>
              <ShipName className="ship-name">{api_name}</ShipName>
              <ShipSubText className="ship-exp">
                <span className="ship-lv">
                  {t('main:Range')}: {api_base + api_bonus}
                  {!!api_bonus && ` (${api_base} + ${api_bonus})`}
                </span>
                <br />
                <span className="ship-lv">
                  {t('main:Fighter Power')}:{' '}
                  {tyku.max === tyku.min ? tyku.min : tyku.min + ' ~ ' + tyku.max}
                </span>
              </ShipSubText>
            </>
          )}
        </ShipInfo>

        <LandBaseStat className="ship-stat landbase-stat">
          <ShipHPTextRow>
            <ShipHP className="ship-hp">
              {api_nowhp} / {api_maxhp}
            </ShipHP>
            <div className="lbac-status-label">
              <Tag className="landbase-status" minimal intent={LBAC_INTENTS[api_action_kind]}>
                {t(LBAC_STATUS_NAMES[api_action_kind])}
              </Tag>
            </div>
          </ShipHPTextRow>
          <span className="hp-progress">
            <ProgressBar
              stripes={false}
              intent={getHpStyle(hpPercentage)}
              value={hpPercentage / 100}
            />
          </span>
        </LandBaseStat>
        <ShipSlot className="ship-slot">
          <LandbaseSlotitems landbaseId={squardId} isMini={false} />
        </ShipSlot>
      </ShipItem>
    </Tooltip>
  )
})
