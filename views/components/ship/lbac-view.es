import React from 'react'
import { connect } from 'react-redux'
import { Label, ProgressBar } from 'react-bootstrap'
import { createSelector } from 'reselect'
import { getHpStyle, getTyku } from 'views/utils/game-utils'
import { LandbaseSlotitems } from './slotitems'
import { landbaseSelectorFactory, landbaseEquipDataSelectorFactory } from 'views/utils/selectors'
import { Trans } from 'react-i18next'

export const SquardRow = connect((state, { squardId }) =>
  createSelector([
    landbaseSelectorFactory(squardId),
    landbaseEquipDataSelectorFactory(squardId),
  ], (landbase, equipsData) => ({
    landbase,
    equipsData,
    squardId,
  }))
)(({landbase, equipsData, squardId}) => {
  let { api_action_kind, api_distance, api_name, api_nowhp, api_maxhp } = landbase
  api_nowhp = api_nowhp || 200
  api_maxhp = api_maxhp || 200
  const tyku = getTyku([equipsData], api_action_kind)
  const hpPercentage = api_nowhp / api_maxhp * 100
  const statuslabel = (() => {
    switch (api_action_kind) {
    // 0=待機, 1=出撃, 2=防空, 3=退避, 4=休息
    case 0:
      return <Label bsStyle='default'><Trans>main:Standby</Trans></Label>
    case 1:
      return <Label bsStyle='danger'><Trans>main:Sortie</Trans></Label>
    case 2:
      return <Label bsStyle='warning'><Trans>main:Defense</Trans></Label>
    case 3:
      return <Label bsStyle='primary'><Trans>main:Retreat</Trans></Label>
    case 4:
      return <Label bsStyle='success'><Trans>main:Rest</Trans></Label>
    }
  })()
  return (
    <div className="ship-item">
      <div className="ship-info ship-info-show">
        <span className="ship-name">
          {api_name}
        </span>
        <div className="ship-exp">
          <span className='ship-lv'>
            <Trans>main:Range</Trans>: {api_distance}
          </span>
          <br />
          <span className="ship-lv">
            <Trans>main:Fighter Power</Trans>: {(tyku.max === tyku.min) ? tyku.min : tyku.min + ' ~ ' + tyku.max}
          </span>
        </div>
      </div>
      <div className="ship-stat landbase-stat">
        <div className="div-row">
          <span className="ship-hp">
            {api_nowhp} / {api_maxhp}
          </span>
          <div className="lbac-status-label">
            {statuslabel}
          </div>
        </div>
        <span className="hp-progress top-space">
          <ProgressBar bsStyle={getHpStyle(hpPercentage)}
            now={hpPercentage} />
        </span>
      </div>
      <div className="ship-slot">
        <LandbaseSlotitems landbaseId={squardId} isMini={false} />
      </div>
    </div>
  )
})
