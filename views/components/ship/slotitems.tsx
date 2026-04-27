import type { RootState } from 'views/redux/reducer-factory'

import { Intent, Position, Tooltip } from '@blueprintjs/core'
import classNames from 'classnames'
import { memoize } from 'lodash'
import path from 'path'
import React, { memo, useMemo } from 'react'
import FontAwesome from 'react-fontawesome'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import { SlotitemIcon } from 'views/components/etc/icon'
import {
  ALevel,
  OnSlotMini,
  SlotItemContainer,
  SlotItems,
} from 'views/components/ship-parts/styled-components'
import { equipIsAircraft } from 'views/utils/game-utils'
import {
  landbaseEquipDataSelectorFactory,
  landbaseSelectorFactory,
  shipDataSelectorFactory,
  shipEquipDataSelectorFactory,
} from 'views/utils/selectors'

import { getItemData } from './slotitems-data'

const slotitemsDataSelectorFactory = memoize((shipId: number) =>
  createSelector(
    [shipDataSelectorFactory(shipId), shipEquipDataSelectorFactory(shipId)],
    (shipPair, equipsData) => {
      const [ship, $ship] = shipPair ?? []
      return {
        api_maxeq: $ship?.api_maxeq,
        equipsData,
        exslotUnlocked: (ship?.api_slot_ex ?? 0) !== 0,
      }
    },
  ),
)

const landbaseSlotitemsDataSelectorFactory = memoize((landbaseId: number) =>
  createSelector(
    [landbaseSelectorFactory(landbaseId), landbaseEquipDataSelectorFactory(landbaseId)],
    (landbase, equipsData) => ({
      api_maxeq: (landbase?.api_plane_info ?? []).map((l) => l.api_max_count),
      api_cond: (landbase?.api_plane_info ?? []).map((l) => l.api_cond),
      api_state: (landbase?.api_plane_info ?? []).map((l) => l.api_state),
      equipsData,
    }),
  ),
)

interface SlotitemsProps {
  shipId: number
}

export const Slotitems = memo(({ shipId }: SlotitemsProps) => {
  const { t } = useTranslation('resources')
  const selector = useMemo(() => slotitemsDataSelectorFactory(shipId), [shipId])
  const { api_maxeq, equipsData, exslotUnlocked } = useSelector((state: RootState) =>
    selector(state),
  )

  return (
    <SlotItems className="slotitems">
      {equipsData?.map((equipData, equipIdx) => {
        const isExslot = equipIdx === equipsData.length - 1
        if (isExslot && !equipData && !exslotUnlocked) {
          return <div key={equipIdx} />
        }
        const [equip, $equip, onslot] = equipData ?? []
        const itemOverlay = equipData && $equip && equip && (
          <div>
            <div>
              <div>
                {$equip.api_name
                  ? t(`resources:${$equip.api_name}`, { keySeparator: '%%%%' })
                  : '??'}
                {equip.api_level == null || equip.api_level === 0 ? undefined : (
                  <strong style={{ color: '#45A9A5' }}>
                    {' '}
                    <FontAwesome name="star" />
                    {equip.api_level}
                  </strong>
                )}
                {equip.api_alv != null && equip.api_alv >= 1 && equip.api_alv <= 7 && (
                  <ALevel
                    className="alv-img"
                    src={path.join('assets', 'img', 'airplane', `alv${equip.api_alv}.png`)}
                  />
                )}
              </div>
              {getItemData($equip).map((data, propId) => (
                <div key={propId}>{data}</div>
              ))}
            </div>
          </div>
        )

        const equipIconId = $equip ? $equip.api_type[3] : 0
        const showOnslot = !equipData || isExslot || ($equip ? equipIsAircraft($equip) : false)
        const maxOnslot = isExslot ? 0 : (api_maxeq?.[equipIdx] ?? 0)
        const onslotText = isExslot ? '+' : equipData ? `${onslot}` : `${maxOnslot}`
        const onslotWarning = !!(equipData && onslot != null && onslot < maxOnslot)

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
                'without-onslot': !showOnslot,
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
  )
})
Slotitems.displayName = 'Slotitems'

interface LandbaseSlotitemsProps {
  landbaseId: number
  isMini?: boolean
  className?: string
}

export const LandbaseSlotitems = memo(
  ({ landbaseId, isMini, className }: LandbaseSlotitemsProps) => {
    const { t } = useTranslation('resources')
    const selector = useMemo(() => landbaseSlotitemsDataSelectorFactory(landbaseId), [landbaseId])
    const { api_maxeq, api_cond, api_state, equipsData } = useSelector((state: RootState) =>
      selector(state),
    )

    return (
      <SlotItems className={classNames('slotitems', className)}>
        {equipsData?.map((equipData, equipIdx) => {
          const [equip, $equip, onslot] = equipData ?? []
          const equipIconId = $equip ? $equip.api_type[3] : 0
          const showOnslot = !equipData || ($equip ? equipIsAircraft($equip) : false)
          const maxOnslot = api_maxeq[equipIdx] ?? 0
          const onslotWarning = !!(equipData && onslot != null && onslot < maxOnslot)
          const onslotText = equipData ? onslot : maxOnslot
          const iconStyle: React.CSSProperties = {
            opacity: api_state[equipIdx] === 2 ? 0.5 : undefined,
            filter:
              (api_cond[equipIdx] ?? 0) > 1
                ? `drop-shadow(0px 0px 4px ${api_cond[equipIdx] === 2 ? '#FB8C00' : '#E53935'})`
                : undefined,
          }
          const itemOverlay = equipData && $equip && equip && (
            <div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {$equip.api_name
                    ? t(`resources:${$equip.api_name}`, { keySeparator: 'chiba' })
                    : '??'}
                  {(equip.api_level ?? 0) > 0 && (
                    <strong style={{ color: '#45A9A5' }}>
                      {' '}
                      <FontAwesome name="star" />
                      {equip.api_level}
                    </strong>
                  )}
                  {equip.api_alv != null && equip.api_alv >= 1 && equip.api_alv <= 7 && (
                    <ALevel
                      className="alv-img"
                      src={path.join('assets', 'img', 'airplane', `alv${equip.api_alv}.png`)}
                    />
                  )}
                  {isMini && (
                    <OnSlotMini
                      className="slotitem-onslot-mini"
                      intent={onslotWarning ? Intent.WARNING : Intent.NONE}
                      minimal
                      hide={!showOnslot || api_state[equipIdx] !== 1}
                    >
                      {onslotText}
                    </OnSlotMini>
                  )}
                  <FontAwesome name="dot-circle-o" /> {$equip.api_distance}
                </div>
                {getItemData($equip).map((data, propId) => (
                  <div key={propId}>{data}</div>
                ))}
              </div>
            </div>
          )

          return (
            <Tooltip
              disabled={!itemOverlay || !equipData}
              position={Position.BOTTOM}
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
    )
  },
)
LandbaseSlotitems.displayName = 'LandbaseSlotitems'
