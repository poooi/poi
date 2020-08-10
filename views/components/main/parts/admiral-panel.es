/* global getStore */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { get, map } from 'lodash'
import moment from 'moment-timezone'
import FontAwesome from 'react-fontawesome'
import { withNamespaces, Trans } from 'react-i18next'
import i18next from 'views/env-parts/i18next'
import { Tag, Position, Intent, Tooltip } from '@blueprintjs/core'
import { compose } from 'redux'
import styled from 'styled-components'

import { CountdownNotifierLabel } from './countdown-timer'
import { configSelector, basicSelector } from 'views/utils/selectors'
import { InfoTooltipEntry, InfoTooltipItem } from 'views/components/etc/styled-components'
import { CardWrapper as CardWrapperL } from './styled-components'

const rankName = [
  '',
  '元帥',
  '大将',
  '中将',
  '少将',
  '大佐',
  '中佐',
  '新米中佐',
  '少佐',
  '中堅少佐',
  '新米少佐',
]

const totalExp = [
  0,
  100,
  300,
  600,
  1000,
  1500,
  2100,
  2800,
  3600,
  4500,
  5500,
  6600,
  7800,
  9100,
  10500,
  12000,
  13600,
  15300,
  17100,
  19000,
  21000,
  23100,
  25300,
  27600,
  30000,
  32500,
  35100,
  37800,
  40600,
  43500,
  46500,
  49600,
  52800,
  56100,
  59500,
  63000,
  66600,
  70300,
  74100,
  78000,
  82000,
  86100,
  90300,
  94600,
  99000,
  103500,
  108100,
  112800,
  117600,
  122500,
  127500,
  132700,
  138100,
  143700,
  149500,
  155500,
  161700,
  168100,
  174700,
  181500,
  188500,
  195800,
  203400,
  211300,
  219500,
  228000,
  236800,
  245900,
  255300,
  265000,
  275000,
  285400,
  296200,
  307400,
  319000,
  331000,
  343400,
  356200,
  369400,
  383000,
  397000,
  411500,
  426500,
  442000,
  458000,
  474500,
  491500,
  509000,
  527000,
  545500,
  564500,
  584500,
  606500,
  631500,
  661500,
  701500,
  761500,
  851500,
  1000000,
  1300000,
  1600000,
  1900000,
  2200000,
  2600000,
  3000000,
  3500000,
  4000000,
  4600000,
  5200000,
  5900000,
  6600000,
  7400000,
  8200000,
  9100000,
  10000000,
  11000000,
  12000000,
  13000000,
  14000000,
  15000000,
]

const resolveDayTime = (time) => {
  const seconds = parseInt(time)
  if (seconds >= 0) {
    const s = seconds % 60
    const m = Math.trunc(seconds / 60) % 60
    const h = Math.trunc(seconds / 3600) % 24
    const d = Math.trunc(seconds / 86400)
    return [
      d ? `${d}${i18next.t('main:d')}` : '',
      h ? `${h}${i18next.t('main:h')}` : '',
      m ? `${m}${i18next.t('main:m')}` : '',
      s ? `${s}${i18next.t('main:s')}` : '',
    ].join(' ')
  } else {
    return ''
  }
}

const getTagIntent = (_, timeRemaining) => {
  switch (true) {
    case timeRemaining > 1800:
      return Intent.NONE
    case timeRemaining > 900:
      return Intent.WARNING
    default:
      return Intent.DANGER
  }
}

const ExpContent = compose(
  withNamespaces(['main']),
  connect((state) => ({
    level: get(state, 'info.basic.api_level', 0),
    exp: get(state, 'info.basic.api_experience', 0),
  })),
)(({ level, exp, t }) =>
  level >= 0 ? (
    <>
      {level < 120 && (
        <InfoTooltipEntry className="info-tooltip-entry">
          <CountdownRow className="info-tooltip-item">{t('main:Next')}</CountdownRow>
          <span>{totalExp[level] - exp}</span>
        </InfoTooltipEntry>
      )}
      <InfoTooltipEntry className="info-tooltip-entry">
        <CountdownRow className="info-tooltip-item">{t('main:Total Exp')}</CountdownRow>
        <span>{exp}</span>
      </InfoTooltipEntry>
    </>
  ) : (
    <span />
  ),
)

// Refresh time:
// - Practice: JST 3h00, 15h00, UTC 18h00, 6h00
// - Quest: JST 5h00, UTC 20h00
// - Senka: JST 22h00 on last day of every month, UTC 13h00
// - Extra Operation: JST 0h00 on first day of every month, UTC 15h00 on last day of every month

const getNextPractice = () => {
  const now = moment.utc()
  const nowHour = now.hour()
  if (nowHour < 6) {
    now.hour(6)
  } else if (nowHour < 18) {
    now.hour(18)
  } else {
    now.hour(30)
  }
  return now.startOf('hour')
}

const getNextQuest = () => {
  const now = moment.utc()
  const nowHour = now.hour()
  if (nowHour < 20) {
    now.hour(20)
  } else {
    now.hour(44)
  }
  return now.startOf('hour')
}

const getNextSenka = () => {
  const m = moment.tz('Asia/Tokyo').endOf('month').subtract(2, 'hour')
  if (+m <= Date.now()) {
    return m.add(1, 'months')
  }
  return m
}

const getNextEO = () => moment.tz('Asia/Tokyo').endOf('month')

const getNewMomentMap = {
  Practice: getNextPractice,
  Quest: getNextQuest,
  Senka: getNextSenka,
  EO: getNextEO,
}

const TeitokuTimer = styled.span`
  position: absolute;
  right: 0.5em;
`

const CountdownItem = styled(InfoTooltipEntry)`
  &:not(:last-child) {
    margin-bottom: 0.5em;
  }
`

const CountdownRow = styled(InfoTooltipItem)`
  margin-right: 6px;
`

const CardWrapper = styled(CardWrapperL)`
  display: flex;
  align-items: center;
`

class CountDownControl extends Component {
  constructor(props) {
    super(props)
    this.moments = {
      Practice: getNextPractice(),
      Quest: getNextQuest(),
      Senka: getNextSenka(),
      EO: getNextEO(),
    }
    this.state = {
      intent: Intent.NONE,
    }
  }

  componentDidMount = () => {
    this.startTick()
    window.addEventListener('countdown.start', this.startTick)
    window.addEventListener('countdown.stop', this.stopTick)
  }

  componentWillUnmount = () => {
    this.stopTick()
    window.removeEventListener('countdown.start', this.startTick)
    window.removeEventListener('countdown.stop', this.stopTick)
  }

  startTick = () => {
    window.ticker.reg('admiral-panel', this.tick)
  }

  stopTick = () => {
    window.ticker.unreg('admiral-panel')
  }

  tick = (currentTime) => {
    // update moments
    Object.keys(this.moments).forEach((key) => {
      if (this.moments[key] - currentTime < 0) {
        this.moments[key] = getNewMomentMap[key]()
      }
    })

    // check styles
    const minRemaining = Math.min(...map(this.moments, (moment) => moment - currentTime))
    const intent = getTagIntent(null, minRemaining / 1000)

    if (intent !== this.state.intent) {
      this.setState({
        intent,
      })
    }
  }

  render() {
    const { intent } = this.state
    return (
      <TeitokuTimer className="teitoku-timer">
        <Tooltip
          position={Position.LEFT_BOTTOM}
          content={<CountdownContent moments={this.moments} />}
        >
          <Tag intent={intent} minimal>
            <FontAwesome name="calendar" />
          </Tag>
        </Tooltip>
      </TeitokuTimer>
    )
  }
}

const isActive = () => getStore('ui.activeMainTab') === 'main-view'

const CountdownContent = ({ moments }) => (
  <div>
    {['Practice', 'Quest', 'Senka', 'EO'].map((name) => (
      <CountdownItem className="info-tooltip-entry countdown-item" key={name}>
        <CountdownRow className="info-tooltip-item">
          <Trans>main:Next {name}</Trans>
        </CountdownRow>
        <span>
          <CountdownNotifierLabel
            timerKey={`next-${name}`}
            completeTime={+moments[name]}
            resolveTime={resolveDayTime}
            getLabelStyle={getTagIntent}
            isActive={isActive}
            minimal={false}
          />
        </span>
      </CountdownItem>
    ))}
  </div>
)

const admiralInfoSelector = createSelector([basicSelector], (basic) => ({
  level: get(basic, 'api_level', -1),
  nickname: get(basic, 'api_nickname', ''),
  rank: get(basic, 'api_rank', 0),
  maxShip: get(basic, 'api_max_chara', 0),
  maxSlotitem: get(basic, 'api_max_slotitem', 0),
}))

const numCheckSelector = createSelector([configSelector], (config) => ({
  shipNumCheck: get(config, 'poi.mapStartCheck.ship.enable', false),
  minShipNum: get(config, 'poi.mapStartCheck.ship.minFreeSlots', 4),
  slotNumCheck: get(config, 'poi.mapStartCheck.item.enable', false),
  minSlotNum: get(config, 'poi.mapStartCheck.item.minFreeSlots', 10),
}))

export const AdmiralPanel = withNamespaces(['main'])(
  connect((state) => ({
    ...admiralInfoSelector(state),
    equipNum: Object.keys(state.info.equips).length,
    shipNum: Object.keys(state.info.ships).length,
    dropCount: state.sortie.dropCount,
    ...numCheckSelector(state),
  }))(function AdmiralPanel({
    t,
    level,
    nickname,
    rank,
    maxShip,
    maxSlotitem,
    equipNum,
    shipNum,
    dropCount,
    shipNumCheck,
    minShipNum,
    slotNumCheck,
    minSlotNum,
    editable,
  }) {
    const shipCountIntent =
      shipNumCheck && maxShip - (shipNum + dropCount) < minShipNum ? 'warning' : Intent.NONE
    const slotCountIntent =
      slotNumCheck && maxSlotitem - equipNum < minSlotNum ? 'warning' : Intent.NONE

    return (
      <CardWrapper elevation={editable ? 2 : 0} interactive={editable}>
        <Tooltip content={<ExpContent />} position={Position.RIGHT}>
          {level >= 0 ? (
            <span>
              {`Lv. ${level}　`}
              <span className="nickname">{nickname}</span>
              <Tag minimal>{t(`resources:${rankName[rank]}`)}</Tag>
            </span>
          ) : (
            <span>{t('Admiral [Not logged in]')}</span>
          )}
        </Tooltip>
        <CountDownControl />
        <span style={{ marginRight: '1em', marginLeft: '1em' }}>
          <span>{t('main:Ships')}: </span>
          <Tag intent={shipCountIntent} minimal>
            {(shipNum || 0) + (dropCount || 0) || '?'} / {maxShip || '?'}
          </Tag>
        </span>
        <span>
          <span>{t('main:Equip')}: </span>
          <Tag intent={slotCountIntent} minimal>
            {equipNum || '?'} / {maxSlotitem || '?'}
          </Tag>
        </span>
      </CardWrapper>
    )
  }),
)
