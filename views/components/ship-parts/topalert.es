import { connect } from 'react-redux'
import React from 'react'
import { Alert, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { join } from 'path-extra'
import { once, memoize } from 'lodash'
import { createSelector } from 'reselect'

import CountdownTimer from 'views/components/main/parts/countdown-timer'
import {
  fleetInBattleSelectorFactory,
  fleetInExpeditionSelectorFactory,
  fleetShipsDataSelectorFactory,
  fleetShipsEquipDataSelectorFactory,
  fleetNameSelectorFactory,
  basicSelector,
  condTimerSelector,
  fleetExpeditionSelectorFactory,
} from 'views/utils/selectors'

const {ROOT, i18n} = window
const __ = i18n.main.__.bind(i18n.main)
const { Component } = React

const getFontStyle = (theme) => {
  if (window.isDarkTheme) {
    return {color: '#FFF'}
  } else {
    return {color: '#000'}
  }
}

const aircraftExpTable = [0, 10, 25, 40, 55, 70, 85, 100, 121]

const aircraftLevelBonus = {
  '6': [0, 0, 2, 5, 9, 14, 14, 22, 22],   // 艦上戦闘機
  '7': [0, 0, 0, 0, 0, 0, 0, 0, 0],       // 艦上爆撃機
  '8': [0, 0, 0, 0, 0, 0, 0, 0, 0],       // 艦上攻撃機
  '11': [0, 1, 1, 1, 1, 3, 3, 6, 6],      // 水上爆撃機
  '45': [0, 0, 2, 5, 9, 14, 14, 22, 22],  // 水上戦闘機
}

const getTyku = (equipsData) => {
  let minTyku = 0
  let maxTyku = 0
  for (let i = 0; i < equipsData.length; i++) {
    for (let j = 0; j < equipsData[i].length; j++) {
      if (!equipsData[i][j]) {
        continue
      }
      const [_equip, $equip, onslot] = equipsData[i][j]
      let tempTyku = 0.0
      let tempAlv
      // Basic tyku
      if (_equip.api_alv) {
        tempAlv = _equip.api_alv
      } else {
        tempAlv = 0
      }
      if ([6, 7, 8].includes($equip.api_type[3])) {
        // 艦载機
        tempTyku += Math.sqrt(onslot) * $equip.api_tyku
        tempTyku += aircraftLevelBonus[$equip.api_type[3]][tempAlv]
        minTyku += Math.floor(tempTyku + Math.sqrt(aircraftExpTable[tempAlv] / 10))
        maxTyku += Math.floor(tempTyku + Math.sqrt(aircraftExpTable[tempAlv + 1] / 10))
      }
      else if ($equip.api_type[3] == 10 && ($equip.api_type[2] == 11 || $equip.api_type[2] == 45)) {
        // 水上機
        tempTyku += Math.sqrt(onslot) * $equip.api_tyku
        tempTyku += aircraftLevelBonus[$equip.api_type[2]][tempAlv]
        minTyku += Math.floor(tempTyku + Math.sqrt(aircraftExpTable[tempAlv] / 10))
        maxTyku += Math.floor(tempTyku + Math.sqrt(aircraftExpTable[tempAlv + 1] / 10))
      }
    }
  }
  return {
    min: minTyku,
    max: maxTyku,
  }
}

// Saku (2-5 旧式)
// 偵察機索敵値×2 ＋ 電探索敵値 ＋ √(艦隊の装備込み索敵値合計 - 偵察機索敵値 - 電探索敵値)
const getSaku25 = (shipsData, equipsData) => {
  let reconSaku = 0
  let shipSaku = 0
  let radarSaku = 0
  let totalSaku = 0
  for (let i = 0; i < equipsData.length; i++) {
    const [_ship] = shipsData[i]
    shipSaku += _ship.api_sakuteki[0]
    for (let j = 0; j < equipsData[i].length; j++) {
      if (!equipsData[i][j]) {
        continue
      }
      const $equip = equipsData[i][j][1]
      switch ($equip.api_type[3]) {
      case 9:
        reconSaku += $equip.api_saku
        shipSaku -= $equip.api_saku
        break
      case 10:
        if ($equip.api_type[2] == 10) {
          reconSaku += $equip.api_saku
          shipSaku -= $equip.api_saku
        }
        break
      case 11:
        radarSaku += $equip.api_saku
        shipSaku -= $equip.api_saku
        break
      default:
        break
      }
    }
  }
  reconSaku = reconSaku * 2.00
  shipSaku = Math.sqrt(shipSaku)
  totalSaku = reconSaku + radarSaku + shipSaku

  return {
    recon: parseFloat(reconSaku.toFixed(2)),
    radar: parseFloat(radarSaku.toFixed(2)),
    ship: parseFloat(shipSaku.toFixed(2)),
    total: parseFloat(totalSaku.toFixed(2)),
  }
}


// Saku (2-5 秋式)
// 索敵スコア = 艦上爆撃機 × (1.04) + 艦上攻撃機 × (1.37) + 艦上偵察機 × (1.66) + 水上偵察機 × (2.00)
//            + 水上爆撃機 × (1.78) + 小型電探 × (1.00) + 大型電探 × (0.99) + 探照灯 × (0.91)
//            + √(各艦毎の素索敵) × (1.69) + (司令部レベルを5の倍数に切り上げ) × (-0.61)
const getSaku25a = (shipsData, equipsData, teitokuLv) => {
  let totalSaku = 0
  let shipSaku = 0
  let equipSaku = 0
  let teitokuSaku = 0
  for (let i = 0; i < equipsData.length; i++) {
    const [_ship] = shipsData[i]
    let shipPureSaku = _ship.api_sakuteki[0]
    for (let j = 0; j < equipsData[i].length; j++) {
      if (!equipsData[i][j]) {
        continue
      }
      const $equip = equipsData[i][j][1]
      shipPureSaku -= $equip.api_saku
      switch ($equip.api_type[3]) {
      case 7:
        equipSaku += $equip.api_saku * 1.04
        break
      case 8:
        equipSaku += $equip.api_saku * 1.37
        break
      case 9:
        equipSaku += $equip.api_saku * 1.66
        break
      case 10:
        if ($equip.api_type[2] == 10) {
          equipSaku += $equip.api_saku * 2.00
        } else if ($equip.api_type[2] == 11) {
          equipSaku += $equip.api_saku * 1.78
        }
        break
      case 11:
        if ($equip.api_type[2] == 12) {
          equipSaku += $equip.api_saku * 1.00
        }
        else if ($equip.api_type[2] == 13) {
          equipSaku += $equip.api_saku * 0.99
        }
        break
      case 24:
        equipSaku += $equip.api_saku * 0.91
        break
      default:
        break
      }
    }
    shipSaku += Math.sqrt(shipPureSaku) * 1.69
  }
  teitokuSaku = 0.61 * Math.floor((teitokuLv + 4) / 5) * 5
  totalSaku = shipSaku + equipSaku - teitokuSaku

  return {
    ship: parseFloat(shipSaku.toFixed(2)),
    item: parseFloat(equipSaku.toFixed(2)),
    teitoku: parseFloat(teitokuSaku.toFixed(2)),
    total: parseFloat(totalSaku.toFixed(2)),
  }
}

// Saku (33)
// 索敵スコア = Sigma(CiSi) + Sigma(sqrt(s)) - Ceil(0.4H) + 2M
//     Si(改修): 電探(1.25 * Sqrt(Star)) 水上偵察機(1.2 * Sqrt(Star))
//     Ci(装備):
//              6 0.6 艦上戦闘機
//              7 0.6 艦上爆撃機
//              8 0.8 艦上攻撃機
//              9 1.0 艦上偵察機
//             10 1.2 水上偵察機
//             11 1.1 水上爆撃機
//             12 0.6 小型電探
//             13 0.6 大型電探
//             26 0.6 対潜哨戒機
//             29 0.6 探照灯
//             34 0.6 司令部施設
//             35 0.6 航空要員
//             39 0.6 水上艦要員
//             40 0.6 大型ソナー
//             41 0.6 大型飛行艇
//             42 0.6 大型探照灯
//             45 0.6 水上戦闘機
//             93 大型電探(II) null
//             94 艦上偵察機(II) null
//     S(各艦毎の素索敵)
//     H(レベル)
//     M(空き数)

const getSaku33 = (shipsData, equipsData, teitokuLv) => {
  let totalSaku = 0
  let shipSaku = 0
  let equipSaku = 0
  let teitokuSaku = 0
  const shipCount = 6
  for (let i = 0; i < equipsData.length; i++) {
    const [_ship] = shipsData[i]
    let shipPureSaku = _ship.api_sakuteki[0]
    for (let j = 0; j < equipsData[i].length; j++) {
      if (!equipsData[i][j]) {
        continue
      }
      const $equip = equipsData[i][j][1]
      shipPureSaku -= $equip.api_saku
      switch ($equip.api_type[2]) {
      case 8:
        equipSaku += $equip.api_saku * 0.8
        break
      case 9:
        equipSaku += $equip.api_saku * 1.0
        break
      case 10:
        equipSaku += ($equip.api_saku + 1.2 * Math.sqrt($equip.api_level || 0)) * 1.2
        break
      case 11:
        equipSaku += $equip.api_saku * 1.1
        break
      case 12:
        equipSaku += ($equip.api_saku + 1.25 * Math.sqrt($equip.api_level || 0)) * 0.6
        break
      case 13:
        equipSaku += ($equip.api_saku + 1.25 * Math.sqrt($equip.api_level || 0)) * 0.6
        break
      default:
        equipSaku += $equip.api_saku * 0.6
        break
      }
    }
    shipSaku += Math.sqrt(shipPureSaku)
  }
  teitokuSaku = Math.ceil(teitokuLv * 0.4)
  totalSaku = shipSaku + equipSaku - teitokuSaku + 2 * shipCount

  return {
    ship: parseFloat(shipSaku.toFixed(2)),
    item: parseFloat(equipSaku.toFixed(2)),
    teitoku: parseFloat(teitokuSaku.toFixed(2)),
    total: parseFloat(totalSaku.toFixed(2)),
  }
}

const notify = (fleetName) => {
  window.notify(`${fleetName} ${__('have recovered from fatigue')}`, {
    type: 'morale',
    title: __('Morale'),
    icon: join(ROOT, 'assets', 'img', 'operation', 'sortie.png'),
  })
}

class CountdownLabel extends Component {
  notify = null
  static propTypes = {
    fleetId: React.PropTypes.number,
    completeTime: React.PropTypes.number,
    shouldNotify: React.PropTypes.bool,
    fleetName: React.PropTypes.string,
  }
  shouldComponentUpdate = (nextProps, nextState) => {
    if (nextProps.completeTime !== this.props.completeTime) {
      this.notify = once(nextProps.notify)
      return true
    }
    return false
  }
  tick = (timeRemaining) => {
    const notifyBefore = 10
    if (this.props.shouldNotify && 0 < timeRemaining && timeRemaining <= notifyBefore) {
      this.notify(this.props.fleetName)
    }
  }
  render () {
    return (
      <span className="expedition-timer">
        <CountdownTimer countdownId={`resting-fleet-${this.props.fleetId}`}
                        completeTime={this.props.completeTime}
                        tickCallback={this.tick} />
      </span>
    )
  }
}

const tykuSelectorFactory = memoize((fleetId) =>
  createSelector(fleetShipsEquipDataSelectorFactory(fleetId),
    (equipsData) =>
      getTyku(equipsData)
  )
)

const admiralLevelSelector = createSelector(basicSelector,
  (basic) => basic.api_level
)

const sakuSelectorFactory = memoize((fleetId) =>
  createSelector([
    fleetShipsDataSelectorFactory(fleetId),
    fleetShipsEquipDataSelectorFactory(fleetId),
    admiralLevelSelector,
  ], (shipsData, equipsData, admiralLevel) =>({
    saku25: getSaku25(shipsData, equipsData),
    saku25a: getSaku25a(shipsData, equipsData, admiralLevel),
    saku33: getSaku33(shipsData, equipsData, admiralLevel),
  }))
)

const topAlertSelectorFactory = memoize((fleetId) =>
  createSelector([
    fleetInBattleSelectorFactory(fleetId),
    fleetInExpeditionSelectorFactory(fleetId),
    fleetShipsDataSelectorFactory(fleetId),
    fleetNameSelectorFactory(fleetId),
    condTimerSelector,
    fleetExpeditionSelectorFactory(fleetId),
    tykuSelectorFactory(fleetId),
    sakuSelectorFactory(fleetId),
  ], (inBattle, inExpedition, shipsData, fleetName, condStartTime, expedition, tyku, saku) => ({
    inExpedition,
    inBattle,
    shipsData,
    fleetName,
    condStartTime,
    expeditionEndTime: expedition[2],
    tyku,
    saku,
  }))
)
export default connect(
  (state, {fleetId}) =>
    topAlertSelectorFactory(fleetId)(state)
)(function TopAlert(props) {
  const {inExpedition, inBattle, shipsData, isMini, fleetId, fleetName, condStartTime, expeditionEndTime, tyku, saku} = props
  const {saku25, saku25a, saku33} = saku
  let totalLv = 0
  let minCond = 100
  shipsData.map(([_ship, $ship]) => {
    totalLv += _ship.api_lv
    minCond = Math.min(minCond, _ship.api_cond)
  })
  let completeTime
  if (inExpedition) {
    completeTime = expeditionEndTime
  } else {
    completeTime = Math.ceil((window.notify.morale - minCond) / 3) * 3 * 60 * 1000 + condStartTime
  }
  return (
    <div style={{width: '100%'}}>
    {
      isMini ?
      <div style={{display: "flex", justifyContent: "space-around", width: '100%'}}>
        <span style={{flex: "none"}}>Lv. {totalLv} </span>
        <span style={{flex: "none", marginLeft: 5}}>{__('Fighter Power')}: {tyku.max}</span>
        <span style={{flex: "none", marginLeft: 5}}>{__('LOS')}: {saku33.total.toFixed(2)}</span>
      </div>
      :
      <Alert style={getFontStyle(window.theme)}>
        <div style={{display: "flex"}}>
          <span style={{flex: 1}}>{__('Total Lv')}. {totalLv}</span>
          <span style={{flex: 1}}>
            <OverlayTrigger placement='bottom' overlay={
              <Tooltip id={`topalert-FP-fleet-${fleetId}`}>
                <span>{__('Minimum FP')}: {tyku.min} {__('Maximum FP')}: {tyku.max}</span>
              </Tooltip>
            }>
              <span>{__('Fighter Power')}: {tyku.max}</span>
            </OverlayTrigger>
          </span>
          <span style={{flex: 1}}>
            <OverlayTrigger placement='bottom' overlay={
              <Tooltip id={`topalert-recon-fleet-${fleetId}`}>
                <div>{__('2-5 fall formula')}: {saku25a.ship} + {saku25a.item} - {saku25a.teitoku} = {saku25a.total}</div>
                <div>{__('2-5 old formula')}: {saku25.ship} + {saku25.recon} + {saku25.radar} = {saku25.total}</div>
                <div>{__('Formula 33')}: {saku33.total}</div>
              </Tooltip>
            }>
              <span>{__('LOS')}: {saku33.total.toFixed(2)}</span>
            </OverlayTrigger>
          </span>
          <span style={{flex: 1}}>{inExpedition ? __('Expedition') : __('Resting')}:
            <span> </span>
            <CountdownLabel fleetId={fleetId}
                            fleetName={fleetName}
                            completeTime={completeTime}
                            notify={notify}
                            shouldNotify={!inExpedition && !inBattle} />
          </span>
        </div>
      </Alert>
    }
    </div>
  )
})
