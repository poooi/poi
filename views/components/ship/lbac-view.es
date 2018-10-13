import React from 'react'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { getHpStyle, getTyku, LBAC_INTENTS, LBAC_STATUS_NAMES } from 'views/utils/game-utils'
import { LandbaseSlotitems } from './slotitems'
import { landbaseSelectorFactory, landbaseEquipDataSelectorFactory } from 'views/utils/selectors'
import { translate } from 'react-i18next'
import { Avatar } from 'views/components/etc/avatar'
import classNames from 'classnames'
import { get } from 'lodash'
import { Tag, ProgressBar, Tooltip, Position } from '@blueprintjs/core'
import { compose } from 'redux'
import memoize from 'fast-memoize'

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
  translate(['main']),
  connect((state, { squardId }) => SquadSelectorFactory(squardId)),
)(({ landbase, equipsData, squardId, t, enableAvatar, compact }) => {
  const { api_action_kind, api_distance, api_name, api_nowhp = 200, api_maxhp = 200 } = landbase
  const tyku = getTyku([equipsData], api_action_kind)
  const hpPercentage = api_nowhp / api_maxhp * 100
  const hideShipName = enableAvatar && compact
  const lbacInfoClass = classNames('ship-info', 'lbac-info', {
    'ship-avatar-padding': enableAvatar,
    'ship-info-show': !hideShipName,
    'ship-info-hidden': hideShipName,
  })
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
            {t('main:Range')}: {api_distance}
          </div>
          <div>
            {t('main:Fighter Power')}:{' '}
            {tyku.max === tyku.min ? tyku.min : tyku.min + ' ~ ' + tyku.max}
          </div>
        </div>
      }
    >
      <div className="ship-item">
        {enableAvatar &&
          !!get(equipsData, '0.0.api_slotitem_id') && (
          <Avatar type="equip" mstId={get(equipsData, '0.0.api_slotitem_id')} height={54} />
        )}

        <div className={lbacInfoClass}>
          {!hideShipName && (
            <>
              <span className="ship-name">{api_name}</span>
              <div className="ship-exp">
                <span className="ship-lv">
                  {t('main:Range')}: {api_distance}
                </span>
                <br />
                <span className="ship-lv">
                  {t('main:Fighter Power')}:{' '}
                  {tyku.max === tyku.min ? tyku.min : tyku.min + ' ~ ' + tyku.max}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="ship-stat landbase-stat">
          <div className="div-row">
            <span className="ship-hp">
              {api_nowhp} / {api_maxhp}
            </span>
            <div className="lbac-status-label">
              <Tag className="landbase-status" minimal intent={LBAC_INTENTS[api_action_kind]}>
                {t(LBAC_STATUS_NAMES[api_action_kind])}
              </Tag>
            </div>
          </div>
          <span className="hp-progress top-space">
            <ProgressBar
              stripes={false}
              intent={getHpStyle(hpPercentage)}
              value={hpPercentage / 100}
            />
          </span>
        </div>
        <div className="ship-slot">
          <LandbaseSlotitems landbaseId={squardId} isMini={false} />
        </div>
      </div>
    </Tooltip>
  )
})
