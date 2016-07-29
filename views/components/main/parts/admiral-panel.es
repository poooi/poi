import { connect } from 'react-redux'
import { Panel, OverlayTrigger, Tooltip } from 'react-bootstrap'
import React from 'react'
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

export default connect(
  (state) => ({
    basic: state.info.basic,
    equipNum: Object.keys(state.info.equips).length,
    shipNum: Object.keys(state.info.ships).length,
  })
)(function TeitokuPanel({basic, equipNum, shipNum}) {
  return (
    <Panel bsStyle="default" className="teitoku-panel"> 
    {
      typeof basic === 'object' && basic.api_level ? (function () {
        const styleCommon = {
          minWidth: '60px',
          padding: '2px',
          float: 'left',
        }
        const styleL = Object.assign({}, styleCommon, {textAlign: 'right'})
        const styleR = Object.assign({}, styleCommon, {textAlign: 'left'})
        const level = basic.api_level
        const exp = basic.api_experience
        const nextExp = totalExp[level] - exp
        return (
          <div>
            <OverlayTrigger placement="bottom" overlay={
              level < 120 ? (
                <Tooltip id='teitoku-exp'>
                  <div style={{display: 'table'}}>
                    <div>
                      <span style={styleL}>Next.</span><span style={styleR}>{nextExp}</span>
                    </div>
                    <div>
                      <span style={styleL}>Total Exp.</span><span style={styleR}>{exp}</span>
                    </div>
                  </div>
                </Tooltip>
              ) : (
                <Tooltip id='teitoku-exp'>Total Exp. {exp}</Tooltip>
              )
            }>
              <span>{`Lv. ${level}　`}
                <span className="nickname">{basic.api_nickname}</span>
                <span id="user-rank">{`　[${rankName[basic.api_rank]}]　`}</span>
              </span>
            </OverlayTrigger>
            {__('Ships')}: {shipNum} / {basic.api_max_chara}　{__('Equipment')}: {equipNum} / {basic.api_max_slotitem}
          </div>
        )
      })() : (
        <div>{`${__('Admiral [Not logged in]')}　${__("Ships")}：? / ?　${__("Equipment")}：? / ?`}</div>
      )
    }
    </Panel>
  )
})
