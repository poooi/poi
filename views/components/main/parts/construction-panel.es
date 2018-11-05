/* global getStore */
import { join } from 'path-extra'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import { MaterialIcon } from 'views/components/etc/icon'
import { join as joinString, range, get, map } from 'lodash'
import FA from 'react-fontawesome'
import { translate } from 'react-i18next'
import i18next from 'views/env-parts/i18next'
import { Intent, Position, Card, ResizeSensor } from '@blueprintjs/core'
import styled from 'styled-components'

import { Avatar } from 'views/components/etc/avatar'
import { CountdownNotifierLabel } from './countdown-timer'
import { Tooltip } from 'views/components/etc/panel-tooltip'

import '../assets/construction-panel.css'

const PanelItem = styled(Tooltip)`
  flex: 0 0 ${props => `${100 / props.dimension}%`};
  max-width: ${props => `${100 / props.dimension}%`};
`

const InnerWrapper = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
`

const Wrapper = styled(Card)`
  display: flex;
  flex-direction: column;
`

const Panel = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
`

const EmptyDock = ({ state }) => (
  <div className="empty-dock">
    <FA name={state === 0 ? 'inbox' : 'lock'} />
  </div>
)

const getPanelDimension = width => {
  if (width > 500) {
    return 4
  }
  if (width > 210) {
    return 2
  }
  return 1
}

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

@translate(['main'])
@connect(state => ({
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
    message: names => `${joinString(names, ', ')} ${i18next.t('main:built')}`,
  }

  state = {
    dimension: 2,
  }

  getDockShipName = (dockId, defaultValue) => {
    const id = get(this.props.constructions, [dockId, 'api_created_ship_id'])
    return id ? this.props.t(`resources:${this.props.$ships[id].api_name}`) : defaultValue
  }

  handleResize= ([entry]) => {
    const dimension = getPanelDimension(entry.contentRect.width)

    if (dimension !== this.state.dimension) {
      this.setState({
        dimension,
      })
    }
  }

  render() {
    const { constructions, canNotify, enableAvatar, editable } = this.props
    const  { dimension } = this.state
    return (
      <ResizeSensor onResize={this.handleResize}>
        <Wrapper elevation={editable ? 2 : 0} interactive={editable}>
          <Panel>
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
              const tooltipTitleClassname = isLSC ? { color: '#D9534F', fontWeight: 'bold' } : undefined

              return (
                <PanelItem
                  key={i}
                  dimension={dimension}
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
                  <InnerWrapper>
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
                    <span className="kdock-name">{dockName}</span>
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
                  </InnerWrapper>
                </PanelItem>
              )
            })}
          </Panel>
        </Wrapper>
      </ResizeSensor>
    )
  }
}
