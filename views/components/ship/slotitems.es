import React from 'react'
import { join } from 'path-extra'
import classNames from 'classnames'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { memoize } from 'lodash'
import FontAwesome from 'react-fontawesome'
import { withNamespaces } from 'react-i18next'
import { Tooltip, Intent, Position } from '@blueprintjs/core'
import { compose } from 'redux'

import { SlotitemIcon } from 'views/components/etc/icon'
import { getItemData } from './slotitems-data'
import { equipIsAircraft } from 'views/utils/game-utils'
import {
  shipDataSelectorFactory,
  shipEquipDataSelectorFactory,
  landbaseSelectorFactory,
  landbaseEquipDataSelectorFactory,
} from 'views/utils/selectors'
import {
  SlotItems,
  SlotItemContainer,
  OnSlotMini,
  ALevel,
} from 'views/components/ship-parts/styled-components'

const slotitemsDataSelectorFactory = memoize(shipId =>
  createSelector(
    [shipDataSelectorFactory(shipId), shipEquipDataSelectorFactory(shipId)],
    ([ship, $ship] = [{}, {}], equipsData) => ({
      api_maxeq: $ship.api_maxeq,
      equipsData,
      exslotUnlocked: ship.api_slot_ex !== 0,
    }),
  ),
)

const landbaseSlotitemsDataSelectorFactory = memoize(landbaseId =>
  createSelector(
    [landbaseSelectorFactory(landbaseId), landbaseEquipDataSelectorFactory(landbaseId)],
    (landbase = {}, equipsData) => ({
      api_maxeq: (landbase.api_plane_info || []).map(l => l.api_max_count),
      api_cond: (landbase.api_plane_info || []).map(l => l.api_cond),
      api_state: (landbase.api_plane_info || []).map(l => l.api_state),
      equipsData,
    }),
  ),
)

export const Slotitems = compose(
  withNamespaces(['resources']),
  connect((state, { shipId }) => slotitemsDataSelectorFactory(shipId)(state)),
)(({ api_maxeq, equipsData, exslotUnlocked, t }) => (
  <SlotItems className="slotitems">
    {equipsData &&
      equipsData.map((equipData, equipIdx) => {
        const isExslot = equipIdx === equipsData.length - 1
        if (isExslot && !equipData && !exslotUnlocked) {
          return <div key={equipIdx} />
        }
        const [equip, $equip, onslot] = equipData || []
        const itemOverlay = equipData && (
          <div>
            <div>
              <div>
                {$equip.api_name
                  ? t(`resources:${$equip.api_name}`, { keySeparator: '%%%%' })
                  : '??'}
                {equip.api_level == null || equip.api_level == 0 ? (
                  undefined
                ) : (
                  <strong style={{ color: '#45A9A5' }}>
                    {' '}
                    <FontAwesome name="star" />
                    {equip.api_level}
                  </strong>
                )}
                {equip.api_alv && equip.api_alv >= 1 && equip.api_alv <= 7 && (
                  <ALevel
                    className="alv-img"
                    src={join('assets', 'img', 'airplane', `alv${equip.api_alv}.png`)}
                  />
                )}
              </div>
              {$equip && getItemData($equip).map((data, propId) => <div key={propId}>{data}</div>)}
            </div>
          </div>
        )

        const equipIconId = equipData ? $equip.api_type[3] : 0
        const showOnslot = !equipData || isExslot || equipIsAircraft($equip)
        const maxOnslot = isExslot ? 0 : api_maxeq[equipIdx]
        const onslotText = isExslot ? '+' : equipData ? `${onslot}` : `${maxOnslot}`
        const onslotWarning = equipData && onslot < maxOnslot

        return (
          <Tooltip
            disabled={!itemOverlay || !equipData}
            position={Position.LEFT}
            content={itemOverlay}
            key={equipIdx}
          >
            <SlotItemContainer
              className={classNames('slotitem-container', {
                'with-onslot': showOnslot,
                'without-onsolot': !showOnslot,
              })}
              data-onslot={onslotText}
              showOnslot={showOnslot}
              warning={onslotWarning}
            >
              <SlotitemIcon className="slotitem-img" slotitemId={equipIconId} />
            </SlotItemContainer>
          </Tooltip>
        )
      })}
  </SlotItems>
))

export const LandbaseSlotitems = compose(
  withNamespaces(['resources']),
  connect((state, { landbaseId }) => landbaseSlotitemsDataSelectorFactory(landbaseId)(state)),
)(({ api_maxeq, api_cond, api_state, equipsData, isMini, t, className }) => (
  <SlotItems className={classNames('slotitems', className)}>
    {equipsData &&
      equipsData.map((equipData, equipIdx) => {
        const [equip, $equip, onslot] = equipData || []
        const equipIconId = equipData ? $equip.api_type[3] : 0
        const showOnslot = !equipData || equipIsAircraft($equip)
        const maxOnslot = api_maxeq[equipIdx]
        const onslotWarning = equipData && onslot < maxOnslot
        const onslotText = equipData ? onslot : maxOnslot
        const iconStyle = {
          opacity: api_state[equipIdx] === 2 ? 0.5 : null,
          filter:
            api_cond[equipIdx] > 1
              ? `drop-shadow(0px 0px 4px ${api_cond[equipIdx] === 2 ? '#FB8C00' : '#E53935'})`
              : null,
        }
        const itemOverlay = equipData && (
          <div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {$equip.api_name
                  ? t(`resources:${$equip.api_name}`, { keySeparator: 'chiba' })
                  : '??'}
                {equip.api_level > 0 && (
                  <strong style={{ color: '#45A9A5' }}>
                    {' '}
                    <FontAwesome name="star" />
                    {equip.api_level}
                  </strong>
                )}
                {equip.api_alv && equip.api_alv >= 1 && equip.api_alv <= 7 && (
                  <ALevel
                    className="alv-img"
                    src={join('assets', 'img', 'airplane', `alv${equip.api_alv}.png`)}
                  />
                )}
                {isMini && (
                  <OnSlotMini
                    className="slotitem-onslot-mini"
                    intent={onslotWarning ? Intent.WARNING : Intent.None}
                    minimal
                    hide={!showOnslot || api_state[equipIdx] !== 1}
                  >
                    {onslotText}
                  </OnSlotMini>
                )}
                <FontAwesome name="dot-circle-o" /> {$equip.api_distance}
              </div>
              {$equip && getItemData($equip).map((data, propId) => <div key={propId}>{data}</div>)}
            </div>
          </div>
        )

        return (
          <Tooltip
            disabled={!itemOverlay || !equipData}
            position={Position.LEFT}
            content={itemOverlay}
            key={equipIdx}
          >
            <SlotItemContainer
              className="slotitem-container"
              data-onslot={onslotText}
              style={iconStyle}
              showOnslot={showOnslot}
              warning={onslotWarning}
            >
              <SlotitemIcon className="slotitem-img" slotitemId={equipIconId} />
            </SlotItemContainer>
          </Tooltip>
        )
      })}
  </SlotItems>
))
