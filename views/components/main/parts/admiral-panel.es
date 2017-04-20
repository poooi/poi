import { connect } from 'react-redux'
import { Panel, OverlayTrigger, Tooltip } from 'react-bootstrap'
import React from 'react'
import { get } from 'lodash'

const { i18n } = window
const __ = i18n.main.__.bind(i18n.main)

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

const resolveDayTime = (seconds) => {
  seconds = parseInt(seconds)
  if (seconds >= 0) {
    const s = seconds % 60
    const m = Math.trunc(seconds / 60) % 60
    const h = Math.trunc(seconds / 3600) % 24
    const d = Math.trunc(seconds / 86400)
    return [d ? `${d}${__('d')}` : '', h ? `${h}${__('h')}` : '', m ? `${m}${__('m')}` : '', s ? `${s}${__('s')}` : ''].join(' ')
  } else {
    return ''
  }
}

const ExpContent = connect(
  (state) => ({
    level: get(state, 'info.basic.api_level', 0),
    exp: get(state, 'info.basic.api_experience', 0),
  })
)(({ level, exp }) => (
  <div style={{display: 'table'}}>
    { level < 120 &&
      <div>
        <span>Next.</span>
        <span>{totalExp[level] - exp}</span>
      </div>
    }
    <div>
      <span>Total Exp.</span>
      <span>{exp}</span>
    </div>
  </div>
))

export default connect(
  (state) => ({
    level: get(state, 'info.basic.api_level', -1),
    nickname: get(state, 'info.basic.api_nickname', ''),
    rank: get(state, 'info.basic.api_rank', 0),
    maxKanmusu: get(state, 'info.basic.api_max_chara', 0),
    maxSlotitem: get(state, 'info.basic.api_max_slotitem', 0),
    equipNum: Object.keys(state.info.equips).length,
    shipNum: Object.keys(state.info.ships).length,
    dropCount: state.sortie.dropCount,
  })
)(function TeitokuPanel({ level, nickname, rank, maxKanmusu, maxSlotitem, equipNum, shipNum, dropCount }) {
  return (
    <Panel bsStyle="default" className="teitoku-panel">
    {
      level>=0 ?
      <div>
        <OverlayTrigger placement="bottom" overlay={<Tooltip id="teitoku-exp"><ExpContent/></Tooltip>}>
          <span>{`Lv. ${level}　`}
            <span className="nickname">{nickname}</span>
            <span id="user-rank">{`　[${rankName[rank]}]　`}</span>
          </span>
        </OverlayTrigger>
        {__('Ships')}: {shipNum + dropCount} / {maxKanmusu}　{__('Equipment')}: {equipNum} / {maxSlotitem}
      </div>
    : 
      <div>{`${__('Admiral [Not logged in]')}　${__("Ships")}：? / ?　${__("Equipment")}：? / ?`}</div>
    }
    </Panel>
  )
})
