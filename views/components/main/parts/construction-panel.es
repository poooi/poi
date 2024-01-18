/* global getStore */
import { join } from 'path-extra'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import { MaterialIcon } from 'views/components/etc/icon'
import { join as joinString, range, get, map } from 'lodash'
import FA from 'react-fontawesome'
import { withNamespaces } from 'react-i18next'
import i18next from 'views/env-parts/i18next'
import { Intent, Position } from '@blueprintjs/core'

import { Avatar } from 'views/components/etc/avatar'
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

const EmptyDock = ({ state }) => (
  <EmptyDockWrapper className="empty-dock">
    <FA name={state === 0 ? 'inbox' : 'lock'} />
  </EmptyDockWrapper>
)

const materials = [1, 2, 3, 4, 7]

const getTagIntent = ({ isLSC }, timeRemaining) =>
  timeRemaining > 600 && isLSC
    ? Intent.DANGER
    : timeRemaining > 600
    ? Intent.PRIMARY
    : timeRemaining > 0
    ? Intent.WARNING
    : timeRemaining == 0
    ? Intent.SUCCESS
    : Intent.NONE

const isActive = () => getStore('ui.activeMainTab') === 'main-view'

@withNamespaces(['main'])
@connect((state) => ({
  constructions: state.info.constructions,
  $ships: state.const.$ships,
  canNotify: state.misc.canNotify,
  enableAvatar: get(state, 'config.poi.appearance.avatar', true),
}))
export class ConstructionPanel extends Component {
  static basicNotifyConfig = {
    icon: join(window.ROOT, 'assets', 'img', 'operation', 'build.png'),
    type: 'construction',
    title: i18next.t('main:Construction'),
    message: (names) => `${joinString(names, ', ')} ${i18next.t('main:built')}`,
  }

  getDockShipName = (dockId, defaultValue) => {
    const id = get(this.props.constructions, [dockId, 'api_created_ship_id'])
    return id ? this.props.t(`resources:${this.props.$ships[id].api_name}`) : defaultValue
  }

  render() {
    const { constructions, canNotify, enableAvatar, editable } = this.props
    return (
      <DockPanelCardWrapper elevation={editable ? 2 : 0} interactive={editable}>
        <Panel>
          {range(4).map((i) => {
            const dock = get(constructions, i, { api_state: -1, api_complete_time: 0 })
            const isInUse = dock.api_state > 0
            const isLSC = isInUse && dock.api_item1 >= 1000
            const dockName =
              dock.api_state == -1
                ? this.props.t('main:Locked')
                : dock.api_state == 0
                ? this.props.t('main:Empty')
                : this.getDockShipName(i, '???')
            const completeTime = isInUse ? dock.api_complete_time : -1
            const tooltipTitleClassname = isLSC
              ? { color: '#D9534F', fontWeight: 'bold' }
              : undefined

            return (
              <PanelItemTooltip
                key={i}
                disabled={!isInUse}
                position={Position.TOP}
                wrapperTagName="div"
                className="panel-item-wrapper kdock-item-wrapper"
                targetTagName="div"
                targetClassName="panel-item kdock-item"
                content={
                  <>
                    {
                      <span style={tooltipTitleClassname}>
                        {dockName}
                        <br />
                      </span>
                    }
                    {map(materials, (id, index) => (
                      <span key={id}>
                        <MaterialIcon materialId={id} className="material-icon" />
                        {dock[`api_item${index + 1}`]}
                      </span>
                    ))}
                  </>
                }
              >
                <DockInnerWrapper>
                  {enableAvatar && (
                    <>
                      {dock.api_state > 0 ? (
                        <Avatar
                          height={20}
                          mstId={get(constructions, [i, 'api_created_ship_id'])}
                        />
                      ) : (
                        <EmptyDock state={dock.api_state} />
                      )}
                    </>
                  )}
                  <DockName className="kdock-name">{dockName}</DockName>
                  <CountdownNotifierLabel
                    timerKey={`kdock-${i + 1}`}
                    completeTime={completeTime}
                    isLSC={isLSC}
                    getLabelStyle={getTagIntent}
                    getNotifyOptions={() =>
                      canNotify &&
                      completeTime >= 0 && {
                        ...this.constructor.basicNotifyConfig,
                        args: dockName,
                        completeTime: completeTime,
                      }
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
}
