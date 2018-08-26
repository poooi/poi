import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Panel, OverlayTrigger, Tooltip, Label } from 'react-bootstrap'
import { createSelector } from 'reselect'
import { get, map } from 'lodash'
import moment from 'moment-timezone'
import FontAwesome from 'react-fontawesome'
import { translate, Trans } from 'react-i18next'
import i18next from 'views/env-parts/i18next'

import { CountdownNotifierLabel } from 'views/components/main/parts/countdown-timer'
import { configSelector, basicSelector } from 'views/utils/selectors'

import '../assets/admiral-panel.css'

const rankName = ['', '元帥', '大将', '中将', '少将', '大佐', '中佐', '新米中佐', '少佐', '中堅少佐', '新米少佐']

const totalExp = [
  0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600,
  4500, 5500, 6600, 7800, 9100, 10500, 12000, 13600, 15300, 17100,
  19000, 21000, 23100, 25300, 27600, 30000, 32500, 35100, 37800, 40600,
  43500, 46500, 49600, 52800, 56100, 59500, 63000, 66600, 70300, 74100,
  78000, 82000, 86100, 90300, 94600, 99000, 103500, 108100, 112800, 117600,
  122500, 127500, 132700, 138100, 143700, 149500, 155500, 161700, 168100, 174700,
  181500, 188500, 195800, 203400, 211300, 219500, 228000, 236800, 245900, 255300,
  265000, 275000, 285400, 296200, 307400, 319000, 331000, 343400, 356200, 369400,
  383000, 397000, 411500, 426500, 442000, 458000, 474500, 491500, 509000, 527000,
  545500, 564500, 584500, 606500, 631500, 661500, 701500, 761500, 851500, 1000000,
  1300000, 1600000, 1900000, 2200000, 2600000, 3000000, 3500000, 4000000, 4600000, 5200000,
  5900000, 6600000, 7400000, 8200000, 9100000, 10000000, 11000000, 12000000, 13000000, 14000000, 15000000]

const resolveDayTime = (time) => {
  const seconds = parseInt(time)
  if (seconds >= 0) {
    const s = seconds % 60
    const m = Math.trunc(seconds / 60) % 60
    const h = Math.trunc(seconds / 3600) % 24
    const d = Math.trunc(seconds / 86400)
    return [d ? `${d}${i18next.t('main:d')}` : '', h ? `${h}${i18next.t('main:h')}` : '', m ? `${m}${i18next.t('main:m')}` : '', s ? `${s}${i18next.t('main:s')}` : ''].join(' ')
  } else {
    return ''
  }
}

const getLabelStyle = (_, timeRemaining) => {
  switch (true) {
  case timeRemaining > 1800:
    return 'default'
  case timeRemaining > 900:
    return 'warning'
  default:
    return 'danger'
  }
}

const ExpContent = translate(['main'])(connect(
  (state) => ({
    level: get(state, 'info.basic.api_level', 0),
    exp: get(state, 'info.basic.api_experience', 0),
  })
)(({ level, exp, t }) => level >= 0
  ? <>
  { level < 120 &&
    <div className='info-tooltip-entry'>
      <span className='info-tooltip-item'>{t('main:Next')}</span>
      <span>{totalExp[level] - exp}</span>
    </div>
  }
  <div className='info-tooltip-entry'>
    <span className='info-tooltip-item'>{t('main:Total Exp')}</span>
    <span>{exp}</span>
  </div>
  </>
  : <span />
))

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
      style: 'default',
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
    Object.keys(this.moments).forEach(key => {
      if (this.moments[key] - currentTime < 0) {
        this.moments[key] = getNewMomentMap[key]()
      }
    })

    // check styles
    const minRemaining = Math.min(...map(this.moments, moment => moment - currentTime))
    const style = getLabelStyle(null, minRemaining / 1000)

    if (style !== this.state.style) {
      this.setState({
        style,
      })
    }
  }

  render() {
    const { style } = this.state
    return(
      <span className="teitoku-timer">
        <OverlayTrigger
          placement="left"
          overlay={
            <Tooltip id="next-time" className="info-tooltip next-time-tooltip">
              <CountdownContent moments={this.moments}/>
            </Tooltip>
          }
        >
          <Label bsStyle={style}><FontAwesome name="calendar" /></Label>
        </OverlayTrigger>
      </span>
    )
  }
}

const CountdownContent = ({moments}) => (
  <div>
    {
      ['Practice', 'Quest', 'Senka', 'EO'].map(name => (
        <div className='info-tooltip-entry' key={name}>
          <span className='info-tooltip-item'><Trans>main:Next {name}</Trans></span>
          <span>
            <CountdownNotifierLabel
              timerKey={`next-${name}`}
              completeTime={+moments[name]}
              resolveTime={resolveDayTime}
              getLabelStyle={getLabelStyle}
            />
          </span>
        </div>
      ))
    }
  </div>
)

const admiralInfoSelector = createSelector(
  [basicSelector],
  (basic) => ({
    level: get(basic, 'api_level', -1),
    nickname: get(basic, 'api_nickname', ''),
    rank: get(basic, 'api_rank', 0),
    maxShip: get(basic, 'api_max_chara', 0),
    maxSlotitem: get(basic, 'api_max_slotitem', 0),
  })
)

const numCheckSelector = createSelector(
  [configSelector],
  (config) => ({
    shipNumCheck: get(config, 'poi.mapStartCheck.ship.enable', false),
    minShipNum: get(config, 'poi.mapStartCheck.ship.minFreeSlots', 4),
    slotNumCheck: get(config, 'poi.mapStartCheck.item.enable', false),
    minSlotNum: get(config, 'poi.mapStartCheck.item.minFreeSlots', 10),
  })
)

export const AdmiralPanel = translate(['main'])(connect(
  (state) => ({
    ...admiralInfoSelector(state),
    equipNum: Object.keys(state.info.equips).length,
    shipNum: Object.keys(state.info.ships).length,
    dropCount: state.sortie.dropCount,
    ...numCheckSelector(state),
  })
)(function AdmiralPanel({ t, level, nickname, rank, maxShip, maxSlotitem,
  equipNum, shipNum, dropCount,
  shipNumCheck, minShipNum, slotNumCheck, minSlotNum }) {
  const shipNumClass = (shipNumCheck && maxShip - (shipNum + dropCount) < minShipNum) ? 'alert alert-warning' : ''
  const slotNumClass = (slotNumCheck && maxSlotitem - equipNum < minSlotNum) ? 'alert alert-warning' : ''

  return (
    <Panel bsStyle="default">
      <Panel.Body>
        <OverlayTrigger placement="bottom" overlay={<Tooltip id="teitoku-exp" className='info-tooltip'><ExpContent/></Tooltip>}>
          {
            level >= 0
              ? <span>
                {`Lv. ${level}　`}
                <span className="nickname">{nickname}</span>
                <span id="user-rank">{`　[${t(`resources:${rankName[rank]}`)}]　`}</span>
              </span>
              : <span>{t('Admiral [Not logged in]')}</span>
          }
        </OverlayTrigger>
        <CountDownControl/>
        <span style={{marginRight: '1em'}}>
          <span>{t('main:Ships')}: </span>
          <span className={shipNumClass}>{((shipNum || 0) + (dropCount || 0)) || '?'} / {maxShip || '?'}</span>
        </span>
        <span>
          <span>{t('main:Equip')}: </span>
          <span className={slotNumClass}>{equipNum || '?'} / {maxSlotitem || '?'}</span>
        </span>
      </Panel.Body>
    </Panel>
  )
}))
