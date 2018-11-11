/* global ROOT, getStore */
import { connect } from 'react-redux'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { join } from 'path-extra'
import { get, join as joinString, memoize } from 'lodash'
import { createSelector } from 'reselect'
import { withNamespaces } from 'react-i18next'
import i18next from 'views/env-parts/i18next'
import { Tooltip, Position } from '@blueprintjs/core'
import { compose } from 'redux'
import styled from 'styled-components'

import { CountdownTimer } from 'views/components/main/parts/countdown-timer'
import { CountdownNotifier } from 'views/utils/notifiers'
import { recoveryEndTime } from 'views/redux/timers/cond'
import { getTyku, getSaku33, getFleetSpeed, getSpeedLabel } from 'views/utils/game-utils'
import {
  fleetInBattleSelectorFactory,
  fleetInExpeditionSelectorFactory,
  fleetShipsDataSelectorFactory,
  fleetShipsDataWithEscapeSelectorFactory,
  fleetShipsEquipDataWithEscapeSelectorFactory,
  fleetNameSelectorFactory,
  basicSelector,
  condTickSelector,
  fleetExpeditionSelectorFactory,
  configSelector,
  miscSelector,
  fleetSlotCountSelectorFactory,
} from 'views/utils/selectors'
import {
  InfoTooltip,
  InfoTooltipEntry,
  InfoTooltipItem,
} from 'views/components/etc/styled-components'

const isActive = () => getStore('ui.activeMainTab') === 'ship-view'

const FleetStats = styled.div`
  white-space: nowrap;
  margin-top: 5px;
  text-align: center;
  width: 100%;
`

const Container = styled.div`
  display: flex;
`

const MiniContainer = styled(Container)`
  width: 100%;
  justify-content: space-around;
`

const Item = styled.span`
  flex: 1;
`

const MiniItem = styled.span`
  flex: 0;
  margin-left: 5px;
  &:first-child {
    margin-left: 0;
  }
`

const ReconTile = styled.span`
  font-size: 110%;
  font-weight: bold;
  text-align: left;
  &:not(:first-child) {
    margin-top: 0.5em;
  }
`

class CountdownLabel extends Component {
  constructor(props) {
    super(props)
    this.notifier = new CountdownNotifier()
  }
  static propTypes = {
    fleetId: PropTypes.number,
    completeTime: PropTypes.number,
    shouldNotify: PropTypes.bool,
    fleetName: PropTypes.string,
  }
  shouldComponentUpdate = (nextProps, nextState) => {
    return nextProps.completeTime !== this.props.completeTime
  }
  tick = timeRemaining => {
    if (this.props.shouldNotify && this.props.completeTime >= 0) this.tryNotify()
  }
  static basicNotifyConfig = {
    type: 'morale',
    title: i18next.t('main:Morale'),
    message: names => `${joinString(names, ', ')} ${i18next.t('main:have recovered from fatigue')}`,
    icon: join(ROOT, 'assets', 'img', 'operation', 'sortie.png'),
  }
  tryNotify = () => {
    this.notifier.tryNotify({
      ...CountdownLabel.basicNotifyConfig,
      args: this.props.fleetName,
      completeTime: this.props.completeTime,
    })
  }
  render() {
    return (
      <span className="expedition-timer">
        <CountdownTimer
          isActive={isActive}
          countdownId={`resting-fleet-${this.props.fleetId}`}
          completeTime={this.props.completeTime}
          tickCallback={this.tick}
        />
      </span>
    )
  }
}

const tykuSelectorFactory = memoize(fleetId =>
  createSelector(fleetShipsEquipDataWithEscapeSelectorFactory(fleetId), (equipsData = []) =>
    getTyku(equipsData),
  ),
)

const admiralLevelSelector = createSelector(basicSelector, basic => basic.api_level)

const sakuSelectorFactory = memoize(fleetId =>
  createSelector(
    [
      fleetShipsDataWithEscapeSelectorFactory(fleetId),
      fleetShipsEquipDataWithEscapeSelectorFactory(fleetId),
      admiralLevelSelector,
      fleetSlotCountSelectorFactory(fleetId),
    ],
    (shipsData = [], equipsData = [], admiralLevel, slotCount) => ({
      saku33: getSaku33(shipsData, equipsData, admiralLevel, 1.0, slotCount),
      saku33x2: getSaku33(shipsData, equipsData, admiralLevel, 2.0, slotCount),
      saku33x3: getSaku33(shipsData, equipsData, admiralLevel, 3.0, slotCount),
      saku33x4: getSaku33(shipsData, equipsData, admiralLevel, 4.0, slotCount),
    }),
  ),
)

const speedSelectorFactory = memoize(fleetId =>
  createSelector([fleetShipsDataWithEscapeSelectorFactory(fleetId)], (shipsData = []) =>
    getFleetSpeed(shipsData),
  ),
)

const fleetStatSelectorFactory = memoize(fleetId =>
  createSelector(
    [
      fleetInBattleSelectorFactory(fleetId),
      fleetInExpeditionSelectorFactory(fleetId),
      fleetShipsDataSelectorFactory(fleetId),
      fleetNameSelectorFactory(fleetId),
      condTickSelector,
      fleetExpeditionSelectorFactory(fleetId),
      tykuSelectorFactory(fleetId),
      sakuSelectorFactory(fleetId),
      speedSelectorFactory(fleetId),
      configSelector,
      miscSelector,
    ],
    (
      inBattle,
      inExpedition,
      shipsData,
      fleetName,
      condTick,
      expedition,
      tyku,
      saku,
      fleetSpeed,
      config,
      { canNotify },
    ) => ({
      inExpedition,
      inBattle,
      shipsData,
      fleetName,
      condTick,
      expeditionEndTime: expedition[2],
      tyku,
      saku,
      fleetSpeed,
      condTarget: get(config, 'poi.notify.morale.value', 49),
      canNotify,
    }),
  ),
)
export const FleetStat = compose(
  withNamespaces(['main']),
  connect((state, { fleetId }) => fleetStatSelectorFactory(fleetId)(state)),
)(
  ({
    inExpedition,
    inBattle,
    shipsData = [],
    isMini,
    fleetId,
    fleetName,
    condTick,
    expeditionEndTime,
    tyku,
    saku,
    fleetSpeed,
    condTarget,
    canNotify,
    t,
  }) => {
    const { saku33, saku33x2, saku33x3, saku33x4 } = saku
    const { speed } = fleetSpeed
    let totalLv = 0
    let minCond = 100
    shipsData.forEach(([_ship] = []) => {
      if (_ship) {
        totalLv += _ship.api_lv
        minCond = Math.min(minCond, _ship.api_cond)
      }
    })
    let completeTime
    if (inExpedition) {
      completeTime = expeditionEndTime
    } else {
      const conds = shipsData.map(([ship = { api_cond: 0 }] = []) => ship.api_cond)
      completeTime = Math.max.apply(
        null,
        conds.map(cond => recoveryEndTime(condTick, cond, condTarget)),
      )
    }
    return (
      <FleetStats className="fleet-stat">
        {isMini ? (
          <MiniContainer>
            <MiniItem>{t(`main:${getSpeedLabel(speed)}`)}</MiniItem>
            <MiniItem>
              {t('main:Fighter Power')}: {tyku.max === tyku.min ? tyku.min : tyku.min + '+'}
            </MiniItem>
            <MiniItem>
              {t('main:LOS')}: {saku33.total.toFixed(2)}
            </MiniItem>
          </MiniContainer>
        ) : (
          <Container>
            <Item>{t(`main:${getSpeedLabel(speed)}`)}</Item>
            <Item>
              {t('main:Total Lv')}. {totalLv}
            </Item>
            <Item>
              <Tooltip
                position={Position.BOTTOM}
                content={
                  <div>
                    <div>
                      {t('main:Minimum FP')}: {tyku.min}
                    </div>
                    <div>
                      {t('main:Maximum FP')}: {tyku.max}
                    </div>
                    <div>
                      {t('main:Basic FP')}: {tyku.basic}
                    </div>
                  </div>
                }
              >
                <span>
                  {t('main:Fighter Power')}: {tyku.max === tyku.min ? tyku.min : tyku.min + '+'}
                </span>
              </Tooltip>
            </Item>
            <Item>
              <Tooltip
                position={Position.BOTTOM}
                content={
                  <InfoTooltip className="info-tooltip">
                    <ReconTile className="recon-title">
                      <span>{t('main:Formula 33')}</span>
                    </ReconTile>
                    <InfoTooltipEntry className="info-tooltip-entry">
                      <InfoTooltipItem className="info-tooltip-item">× 1</InfoTooltipItem>
                      <span>{saku33.total}</span>
                    </InfoTooltipEntry>
                    <InfoTooltipEntry className="info-tooltip-entry">
                      <InfoTooltipItem className="info-tooltip-item">{'× 2'}</InfoTooltipItem>
                      <span>{saku33x2.total}</span>
                    </InfoTooltipEntry>
                    <InfoTooltipEntry className="info-tooltip-entry">
                      <InfoTooltipItem className="info-tooltip-item">{'× 3'}</InfoTooltipItem>
                      <span>{saku33x3.total}</span>
                    </InfoTooltipEntry>
                    <InfoTooltipEntry className="info-tooltip-entry">
                      <InfoTooltipItem className="info-tooltip-item">{'× 4'}</InfoTooltipItem>
                      <span>{saku33x4.total}</span>
                    </InfoTooltipEntry>
                  </InfoTooltip>
                }
              >
                <span>
                  {t('main:LOS')}: {saku33.total.toFixed(2)}
                </span>
              </Tooltip>
            </Item>
            <Item>
              {inExpedition ? t('main:Expedition') : t('main:Resting')}
              <span> </span>
              <CountdownLabel
                fleetId={fleetId}
                fleetName={fleetName}
                completeTime={completeTime}
                shouldNotify={!inExpedition && !inBattle && canNotify}
              />
            </Item>
          </Container>
        )}
      </FleetStats>
    )
  },
)
