import { join } from 'path-extra'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import { MaterialIcon } from 'views/components/etc/icon'
import { join as joinString, range, get, map } from 'lodash'
import FA from 'react-fontawesome'
import { translate } from 'react-i18next'
import i18next from 'views/env-parts/i18next'
import { Tooltip, Intent, Position } from '@blueprintjs/core'

import { Avatar } from 'views/components/etc/avatar'
import { CountdownNotifierLabel } from './countdown-timer'

import '../assets/construction-panel.css'

const EmptyDock = ({ state }) => (
  <div className="empty-dock">
    <FA name={state === 0 ? 'inbox' : 'lock'} />
  </div>
)

const getPanelDimension = width => {
  if (width > 700) {
    return 4
  }
  if (width > 350) {
    return 2
  }
  return 1
}

const materials = [1, 2, 3, 4, 7]

@translate(['main'])
@connect(state => ({
  constructions: state.info.constructions,
  $ships: state.const.$ships,
  canNotify: state.misc.canNotify,
  enableAvatar: get(state, 'config.poi.appearance.avatar', true),
  dimension: getPanelDimension(get(state, 'layout.combinedpane.width', 250)),
}))
export class ConstructionPanel extends Component {
  static basicNotifyConfig = {
    icon: join(window.ROOT, 'assets', 'img', 'operation', 'build.png'),
    type: 'construction',
    title: i18next.t('main:Construction'),
    message: names => `${joinString(names, ', ')} ${i18next.t('main:built')}`,
  }

  getDockShipName = (dockId, defaultVal) => {
    const id = get(this.props.constructions, [dockId, 'api_created_ship_id'])
    return id ? this.props.t(`resources:${this.props.$ships[id].api_name}`) : defaultVal
  }

  getLabelStyle = ({ isLSC }, timeRemaining) => {
    return timeRemaining > 600 && isLSC
      ? Intent.INTENT_DANGER
      : timeRemaining > 600
        ? Intent.INTENT_PRIMARY
        : timeRemaining > 0
          ? Intent.INTENT_WARNING
          : timeRemaining == 0
            ? Intent.INTENT_SUCCESS
            : null
  }

  render() {
    const { constructions, canNotify, enableAvatar, dimension } = this.props
    return (
      <>
        {range(4).map(i => {
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
          const tooltipTitleClassname = isLSC ? { color: '#D9534F', fontWeight: 'bold' } : null

          return (
            <div
              key={i}
              className="panel-item-wrapper kdock-item-wrapper"
              style={{ flexBasis: `calc(${100 / dimension}% - 8px)` }}
            >
              <Tooltip
                disabled={!isInUse}
                position={Position.TOP}
                className="panel-item-tooltip kdock-item-tooltip"
                targetClassName="panel-item-content kdock-item-content"
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
                <div className="panel-ietm kdock-item">
                  {enableAvatar && (
                    <>
                      {dock.api_state > 0 ? (
                        <Avatar height={20} mstId={get(constructions, [i, 'api_created_ship_id'])} />
                      ) : (
                        <EmptyDock state={dock.api_state} />
                      )}
                    </>
                  )}
                  <span className="kdock-name">{dockName}</span>
                  <CountdownNotifierLabel
                    timerKey={`kdock-${i + 1}`}
                    completeTime={completeTime}
                    isLSC={isLSC}
                    getLabelStyle={this.getLabelStyle}
                    getNotifyOptions={() =>
                      canNotify &&
                      completeTime >= 0 && {
                        ...this.constructor.basicNotifyConfig,
                        args: dockName,
                        completeTime: completeTime,
                      }
                    }
                  />
                </div>
              </Tooltip>
            </div>
          )
        })}
      </>
    )
  }
}
