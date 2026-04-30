import type { ConstState } from 'views/redux/const'
import type { Ship } from 'views/redux/info/ships'
import type { RootState } from 'views/redux/reducer-factory'

import { Position, Intent, Tooltip } from '@blueprintjs/core'
import cls from 'classnames'
import { join as joinString, range, get } from 'lodash'
import path from 'path'
import React from 'react'
import FA from 'react-fontawesome'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import { styled } from 'styled-components'
import { Avatar } from 'views/components/etc/avatar'
import { getStore } from 'views/create-store'
import { ROOT } from 'views/env'
import {
  repairsSelector,
  constSelector,
  shipsSelector,
  miscSelector,
  inRepairShipsIdSelector,
  createDeepCompareArraySelector,
} from 'views/utils/selectors'
import { indexify, timeToString } from 'views/utils/tools'

import { CountdownNotifierLabel } from './countdown-timer'
import {
  DockPanelCardWrapper,
  PanelItemTooltip,
  DockInnerWrapper,
  Panel,
  Watermark as WatermarkL,
  DockName,
  EmptyDockWrapper,
} from './styled-components'

const Watermark = styled(WatermarkL)`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 52px;
  height: 52px;
  font-size: 52px;
  opacity: 0.15;
  z-index: -1;
  text-align: right;
`

const inRepairShipsDataSelector = createSelector(
  [inRepairShipsIdSelector, shipsSelector],
  (inRepairShipsId, ships) => inRepairShipsId?.map((shipId) => ships[shipId]) ?? [],
)

const EmptyDock = ({ state }: { state: number }) => (
  <EmptyDockWrapper className="empty-dock">
    <FA name={state === 0 ? 'bath' : 'lock'} />
  </EmptyDockWrapper>
)

const getTagIntent = (_props: unknown, timeRemaining: number): Intent =>
  timeRemaining > 600
    ? Intent.PRIMARY
    : timeRemaining > 60
      ? Intent.WARNING
      : timeRemaining >= 0
        ? Intent.SUCCESS
        : Intent.NONE

const isActive = () => getStore('ui.activeMainTab') === 'main-view'

const repairPanelSelector = createDeepCompareArraySelector(
  [
    repairsSelector,
    constSelector,
    inRepairShipsDataSelector,
    miscSelector,
    (state: RootState) => state.config?.poi?.appearance?.avatar ?? true,
  ],
  (repairs, { $ships }, inRepairShips, { canNotify }, enableAvatar) => ({
    repairs,
    $ships,
    inRepairShips,
    canNotify,
    enableAvatar,
  }),
)

interface RepairDock {
  api_complete_time: number
  api_complete_time_str: string
  api_item1: number
  api_item2: number
  api_item3: number
  api_item4: number
  api_ship_id: number
  api_state: number
}

interface RepairPanelInnerProps {
  repairs: RepairDock[]
  $ships: ConstState['$ships']
  inRepairShips: Ship[]
  canNotify: boolean
  enableAvatar: boolean
  editable?: boolean
}

const repairBasicNotifyConfig = {
  type: 'repair',
  title: '',
  message: (names: string) => names,
  icon: path.join(ROOT, 'assets', 'img', 'operation', 'repair.png'),
  preemptTime: 60,
}

const RepairPanelInner = ({
  canNotify,
  repairs,
  $ships,
  inRepairShips,
  enableAvatar,
  editable,
}: RepairPanelInnerProps) => {
  const ships = indexify(inRepairShips)
  return (
    <DockPanelCardWrapper elevation={editable ? 2 : 0} interactive={editable}>
      <Panel>
        {range(0, 4).map((i) => {
          const emptyRepair: RepairDock = {
            api_complete_time: 0,
            api_complete_time_str: '0',
            api_item1: 0,
            api_item2: 0,
            api_item3: 0,
            api_item4: 0,
            api_ship_id: 0,
            api_state: 0,
          }
          const dock = (repairs[i] as RepairDock | undefined) ?? emptyRepair
          const completeTime = dock.api_complete_time || -1
          let hpPercentage: number | undefined
          if (dock.api_state > 0) {
            hpPercentage =
              (100 * get(ships, [dock.api_ship_id, 'api_nowhp'])) /
              get(ships, [dock.api_ship_id, 'api_maxhp'])
          }
          return (
            <RepairPanelRow
              key={i}
              i={i}
              dock={dock}
              ships={ships}
              $ships={$ships}
              canNotify={canNotify}
              enableAvatar={enableAvatar}
              completeTime={completeTime}
              hpPercentage={hpPercentage}
              basicNotifyConfig={repairBasicNotifyConfig}
            />
          )
        })}
      </Panel>
      <Watermark>
        <FA name="fill" />
      </Watermark>
    </DockPanelCardWrapper>
  )
}

const RepairPanelRow = ({
  i,
  dock,
  ships,
  $ships,
  canNotify,
  enableAvatar,
  completeTime,
  hpPercentage,
  basicNotifyConfig,
}: {
  i: number
  dock: RepairDock
  ships: Record<number, Ship>
  $ships: ConstState['$ships']
  canNotify: boolean
  enableAvatar: boolean
  completeTime: number
  hpPercentage?: number
  basicNotifyConfig: {
    type: string
    title: string
    message: (names: string) => string
    icon: string
    preemptTime: number
  }
}) => {
  const { t } = useTranslation('main')

  const notifyTitle = t('main:Docking')
  const notifyMessage = (names: string) =>
    `${joinString(names, ', ')} ${t('main:repair completed')}`

  const dockName =
    dock.api_state === -1
      ? t('main:Locked')
      : dock.api_state === 0
        ? t('main:Empty')
        : t(`resources:${$ships?.[ships[dock.api_ship_id]?.api_ship_id]?.api_name}`)

  return (
    <PanelItemTooltip key={i} className={cls('panel-item', 'ndock-item', { avatar: enableAvatar })}>
      <DockInnerWrapper>
        {enableAvatar && (
          <>
            {dock.api_state > 0 ? (
              <Avatar
                height={20}
                mstId={ships[dock.api_ship_id]?.api_ship_id}
                isDamaged={hpPercentage !== undefined && hpPercentage <= 50}
              />
            ) : (
              <EmptyDock state={dock.api_state} />
            )}
          </>
        )}
        <DockName className="ndock-name">{dockName}</DockName>
        <Tooltip
          position={Position.LEFT}
          disabled={dock.api_state < 0}
          content={
            <div>
              <strong>{t('main:Finish By')}: </strong>
              {timeToString(completeTime)}
            </div>
          }
        >
          <CountdownNotifierLabel
            timerKey={`ndock-${i + 1}`}
            completeTime={completeTime}
            getLabelStyle={getTagIntent}
            getNotifyOptions={() =>
              canNotify && completeTime >= 0
                ? {
                    ...basicNotifyConfig,
                    title: notifyTitle,
                    message: notifyMessage,
                    args: dockName,
                    completeTime,
                  }
                : undefined
            }
            isActive={isActive}
          />
        </Tooltip>
      </DockInnerWrapper>
    </PanelItemTooltip>
  )
}

export const RepairPanel = ({ editable }: { editable?: boolean }) => {
  const data = useSelector((state: RootState) => repairPanelSelector(state))
  return (
    <RepairPanelInner
      repairs={data.repairs as RepairDock[]}
      $ships={data.$ships}
      inRepairShips={data.inRepairShips}
      canNotify={data.canNotify}
      enableAvatar={data.enableAvatar}
      editable={editable}
    />
  )
}
