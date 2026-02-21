import { Tooltip, Intent, Position } from '@blueprintjs/core'
import classNames from 'classnames'
import { memoize } from 'lodash'
import { join } from 'path-extra'
import React from 'react'
import FontAwesome from 'react-fontawesome'
import { useTranslation } from 'react-i18next'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { SlotitemIcon } from 'views/components/etc/icon'
import {
  SlotItems,
  SlotItemContainer,
  OnSlotMini,
  ALevel,
} from 'views/components/ship-parts/styled-components'
import { equipIsAircraft } from 'views/utils/game-utils'
import {
  shipDataSelectorFactory,
  shipEquipDataSelectorFactory,
  landbaseSelectorFactory,
  landbaseEquipDataSelectorFactory,
} from 'views/utils/selectors'

import { getItemData } from './slotitems-data'

interface Equip {
  api_slotitem_id?: number
  api_name?: string
  api_type: [number, number, number, number]
  api_level?: number
  api_alv?: number
  api_distance?: number
  [key: string]: unknown
}

interface Ship {
  api_slot_ex: number
  [key: string]: unknown
}

interface Landbase {
  api_plane_info: Array<{
    api_max_count: number
    api_cond: number
    api_state: number
  }>
  [key: string]: unknown
}

interface SlotitemsData {
  api_maxeq: number[]
  equipsData: ([Equip, Equip, number] | undefined)[]
  exslotUnlocked: boolean
}

interface LandbaseSlotitemsData {
  api_maxeq: number[]
  api_cond: number[]
  api_state: number[]
  equipsData: ([Equip, Equip, number] | undefined)[]
}

interface SlotitemsProps {
  shipId: number
}

type SlotitemsStateProps = SlotitemsData

interface SlotitemsComponentProps extends SlotitemsProps, SlotitemsStateProps {}

interface LandbaseSlotitemsProps {
  landbaseId: number
  isMini?: boolean
  className?: string
}

type LandbaseSlotitemsStateProps = LandbaseSlotitemsData

interface LandbaseSlotitemsComponentProps extends LandbaseSlotitemsProps, LandbaseSlotitemsStateProps {}

const slotitemsDataSelectorFactory = memoize((shipId: number) =>
  createSelector(
    [shipDataSelectorFactory(shipId), shipEquipDataSelectorFactory(shipId)],
    ([ship, $ship] = [{}, {}] as [Ship, Ship], equipsData) => ({
      api_maxeq: $ship.api_maxeq,
      equipsData,
      exslotUnlocked: ship.api_slot_ex !== 0,
    }),
  ),
)

const landbaseSlotitemsDataSelectorFactory = memoize((landbaseId: number) =>
  createSelector(
    [landbaseSelectorFactory(landbaseId), landbaseEquipDataSelectorFactory(landbaseId)],
    (landbase: Landbase = {} as Landbase, equipsData) => ({
      api_maxeq: (landbase.api_plane_info || []).map((l) => l.api_max_count),
      api_cond: (landbase.api_plane_info || []).map((l) => l.api_cond),
      api_state: (landbase.api_plane_info || []).map((l) => l.api_state),
      equipsData,
    }),
  ),
)

const SlotitemsComponent: React.FC<SlotitemsComponentProps> = ({
  api_maxeq,
  equipsData,
  exslotUnlocked,
}) => {
  const { t } = useTranslation(['resources'])

  return (
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
                  {$equip?.api_name
                    ? t(`resources:${$equip.api_name}`, { keySeparator: '%%%%' })
                    : '??'}
                  {equip?.api_level == null || equip?.api_level === 0 ? undefined : (
                    <strong style={{ color: '#45A9A5' }}>
                      {' '}
                      <FontAwesome name="star" />
                      {equip.api_level}
                    </strong>
                  )}
                  {equip?.api_alv && equip.api_alv >= 1 && equip.api_alv <= 7 && (
                    <ALevel
                      className="alv-img"
                      src={join('assets', 'img', 'airplane', `alv${equip.api_alv}.png`)}
                    />
                  )}
                </div>
                {$equip && getItemData($equip as Equip).map((data, propId) => <div key={propId}>{data}</div>)}
              </div>
            </div>
          )

          const equipIconId = equipData ? $equip?.api_type?.[3] : 0
          const showOnslot = !equipData || isExslot || equipIsAircraft($equip)
          const maxOnslot = isExslot ? 0 : api_maxeq?.[equipIdx] ?? 0
          const onslotText = isExslot ? '+' : equipData ? `${onslot}` : `${maxOnslot}`
          const onslotWarning = !!equipData && !!onslot && onslot < maxOnslot

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
                <SlotitemIcon className="slotitem-img" slotitemId={equipIconId || 0} />
              </SlotItemContainer>
            </Tooltip>
          )
        })}
    </SlotItems>
  )
}

const LandbaseSlotitemsComponent: React.FC<LandbaseSlotitemsComponentProps> = ({
  api_maxeq,
  api_cond,
  api_state,
  equipsData,
  isMini,
  className,
}) => {
  const { t } = useTranslation(['resources'])

  return (
    <SlotItems className={classNames('slotitems', className)}>
      {equipsData &&
        equipsData.map((equipData, equipIdx) => {
          const [equip, $equip, onslot] = equipData || []
          const equipIconId = equipData ? $equip?.api_type?.[3] : 0
          const showOnslot = !equipData || equipIsAircraft($equip)
          const maxOnslot = api_maxeq?.[equipIdx] ?? 0
          const onslotWarning = !!equipData && !!onslot && onslot < maxOnslot
          const onslotText = equipData ? onslot : maxOnslot
          const iconStyle: React.CSSProperties = {
            opacity: api_state?.[equipIdx] === 2 ? 0.5 : undefined,
            filter:
              api_cond?.[equipIdx] > 1
                ? `drop-shadow(0px 0px 4px ${api_cond[equipIdx] === 2 ? '#FB8C00' : '#E53935'})`
                : undefined,
          }
          const itemOverlay = equipData && (
            <div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {$equip?.api_name
                    ? t(`resources:${$equip.api_name}`, { keySeparator: 'chiba' })
                    : '??'}
                  {equip && (equip as Equip).api_level && (equip as Equip).api_level! > 0 && (
                    <strong style={{ color: '#45A9A5' }}>
                      {' '}
                      <FontAwesome name="star" />
                      {(equip as Equip).api_level}
                    </strong>
                  )}
                  {(equip as Equip)?.api_alv &&
                    (equip as Equip).api_alv! >= 1 &&
                    (equip as Equip).api_alv! <= 7 && (
                      <ALevel
                        className="alv-img"
                        src={join('assets', 'img', 'airplane', `alv${(equip as Equip).api_alv}.png`)}
                      />
                    )}
                  {isMini && (
                    <OnSlotMini
                      className="slotitem-onslot-mini"
                      intent={onslotWarning ? Intent.WARNING : Intent.None}
                      minimal
                      hide={!showOnslot || api_state?.[equipIdx] !== 1}
                    >
                      {onslotText}
                    </OnSlotMini>
                  )}
                  <FontAwesome name="dot-circle-o" /> {(equip as Equip)?.api_distance}
                </div>
                {$equip && getItemData($equip as Equip).map((data, propId) => <div key={propId}>{data}</div>)}
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
                <SlotitemIcon className="slotitem-img" slotitemId={equipIconId || 0} />
              </SlotItemContainer>
            </Tooltip>
          )
        })}
    </SlotItems>
  )
}

const mapStateToPropsSlotitems = (state: unknown, ownProps: SlotitemsProps): SlotitemsStateProps => ({
  ...slotitemsDataSelectorFactory(ownProps.shipId)(state),
})

const mapStateToPropsLandbase = (state: unknown, ownProps: LandbaseSlotitemsProps): LandbaseSlotitemsStateProps => ({
  ...landbaseSlotitemsDataSelectorFactory(ownProps.landbaseId)(state),
})

export const Slotitems = connect(mapStateToPropsSlotitems)(SlotitemsComponent)
export const LandbaseSlotitems = connect(mapStateToPropsLandbase)(LandbaseSlotitemsComponent)
