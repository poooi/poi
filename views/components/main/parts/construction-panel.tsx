import type { RootState } from 'views/redux/reducer-factory'

import { Intent, Position } from '@blueprintjs/core'
import { join as joinString, range, map } from 'lodash'
import path from 'path'
import React from 'react'
import FA from 'react-fontawesome'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Avatar } from 'views/components/etc/avatar'
import { MaterialIcon } from 'views/components/etc/icon'
import i18next from 'views/env-parts/i18next'

import { CountdownNotifierLabel } from './countdown-timer'
import {
  DockPanelCardWrapper,
  PanelItemTooltip,
  DockInnerWrapper,
  Panel,
  Watermark,
  DockName,
  EmptyDockWrapper,
} from './styled-components'

const EmptyDock = ({ state }: { state: number }) => (
  <EmptyDockWrapper className="empty-dock">
    <FA name={state === 0 ? 'inbox' : 'lock'} />
  </EmptyDockWrapper>
)

const materials = [1, 2, 3, 4, 7]

const getTagIntent = ({ isLSC }: { isLSC?: boolean }, timeRemaining: number): Intent =>
  timeRemaining > 600 && isLSC
    ? Intent.DANGER
    : timeRemaining > 600
      ? Intent.PRIMARY
      : timeRemaining > 0
        ? Intent.WARNING
        : timeRemaining === 0
          ? Intent.SUCCESS
          : Intent.NONE

const isActive = () => window.getStore('ui.activeMainTab') === 'main-view'

const basicNotifyConfig = {
  icon: path.join(window.ROOT, 'assets', 'img', 'operation', 'build.png'),
  type: 'construction',
  title: i18next.t('main:Construction'),
  message: (names: string) => `${joinString(names, ', ')} ${i18next.t('main:built')}`,
}

const getMaterialId = (index: number) => {
  switch (index) {
    case 0:
      return 'api_item1'
    case 1:
      return 'api_item2'
    case 2:
      return 'api_item3'
    case 3:
      return 'api_item4'
    case 4:
    default:
      return 'api_item5'
  }
}

export const ConstructionPanel = ({ editable }: { editable?: boolean }) => {
  const { t } = useTranslation('main')
  const constructions = useSelector((state: RootState) => state.info.constructions)
  const $ships = useSelector((state: RootState) => state.const.$ships)
  const canNotify = useSelector((state: RootState) => state.misc?.canNotify ?? false)
  const enableAvatar = useSelector(
    (state: RootState) => state.config?.poi?.appearance?.avatar ?? true,
  )

  const getDockShipName = (dockId: number, defaultValue: string): string => {
    const id = constructions?.[dockId]?.api_created_ship_id
    return id && $ships?.[id] ? t(`resources:${$ships[id].api_name}`) : defaultValue
  }

  return (
    <DockPanelCardWrapper elevation={editable ? 2 : 0} interactive={editable}>
      <Panel>
        {range(4).map((i) => {
          const dock = constructions[i] ?? {
            api_state: -1,
            api_complete_time: 0,
          }
          const isInUse = dock.api_state > 0
          const isLSC = isInUse && (dock.api_item1 ?? 0) >= 1000
          const dockName =
            dock.api_state === -1
              ? t('main:Locked')
              : dock.api_state === 0
                ? t('main:Empty')
                : getDockShipName(i, '???')
          const completeTime = isInUse ? dock.api_complete_time : -1
          const tooltipTitleClassname: React.CSSProperties | undefined = isLSC
            ? { color: '#D9534F', fontWeight: 'bold' }
            : undefined

          return (
            <PanelItemTooltip
              key={i}
              disabled={!isInUse}
              position={Position.TOP}
              className="panel-item-wrapper kdock-item-wrapper"
              content={
                <>
                  <span style={tooltipTitleClassname}>
                    {dockName}
                    <br />
                  </span>
                  {map(materials, (id, index) => (
                    <span key={id}>
                      <MaterialIcon materialId={id} className="material-icon" />
                      {dock[getMaterialId(index)] ?? 0}
                    </span>
                  ))}
                </>
              }
            >
              <DockInnerWrapper>
                {enableAvatar && (
                  <>
                    {dock.api_state > 0 ? (
                      <Avatar height={20} mstId={constructions?.[i]?.api_created_ship_id ?? 0} />
                    ) : (
                      <EmptyDock state={dock.api_state} />
                    )}
                  </>
                )}
                <DockName className="kdock-name">{dockName}</DockName>
                <CountdownNotifierLabel
                  timerKey={`kdock-${i + 1}`}
                  completeTime={completeTime}
                  getLabelStyle={(_props, timeRemaining) => getTagIntent({ isLSC }, timeRemaining)}
                  getNotifyOptions={() =>
                    canNotify && completeTime >= 0
                      ? {
                          ...basicNotifyConfig,
                          args: dockName,
                          completeTime,
                        }
                      : undefined
                  }
                  isActive={isActive}
                />
              </DockInnerWrapper>
            </PanelItemTooltip>
          )
        })}
      </Panel>
      <Watermark>
        <FA name="industry" />
      </Watermark>
    </DockPanelCardWrapper>
  )
}
