import React, { Fragment } from 'react'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { memoize, get } from 'lodash'
import { OverlayTrigger, Tooltip, Label } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import i18next from 'i18next'

import { shipDataSelectorFactory, shipEquipDataSelectorFactory } from 'views/utils/selectors'
import { getShipAACIs, getShipAllAACIs, AACITable } from 'views/utils/aaci'


const __t = str => str.includes('/')
  ? str.split(' / ').map(s => i18next.t(`resources:${s}`)).map(s => i18next.t(`main:${s}`)).join(' / ') : i18next.t(`resources:${str}`)

const AACISelectorFactory = memoize(shipId =>
  createSelector([
    shipDataSelectorFactory(shipId),
    shipEquipDataSelectorFactory(shipId),
  ], ([_ship = {}, $ship = {}] = [], _equips = []) => {
    const ship = { ...$ship, ..._ship }
    const equips = _equips.filter(([_equip, $equip, onslot] = []) => !!_equip && !!$equip)
      .map(([_equip, $equip, onslot]) => ({ ...$equip, ..._equip }))

    return getShipAACIs(ship, equips)
  })
)

const maxAACIShotdownSelectorFactory = memoize(shipId =>
  createSelector([
    shipDataSelectorFactory(shipId),
  ], ([_ship = {}, $ship = {}] = []) => {
    const AACIs = getShipAllAACIs({ ...$ship, ..._ship })
    return Math.max(...AACIs.map(id => AACITable[id].fixed || 0))
  })
)

const AACIIndicator = connect(
  (state, { shipId }) => ({
    AACIs: AACISelectorFactory(shipId)(state) || [],
    maxShotdown: maxAACIShotdownSelectorFactory(shipId)(state),
  })
)(({ AACIs, maxShotdown, shipId }) => {
  const currentMax = Math.max(...AACIs.map(id => AACITable[id].fixed || 0))

  const tooltip = AACIs.length &&
  (
    <Fragment>
      {
        AACIs.map(id =>
          <div className="info-tooltip-entry" key={id}>
            <span className="info-tooltip-item">
              <Trans count={id}>main:AACIType</Trans>{get(AACITable, `${id}.name.length`, 0) > 0 ? ` - ${__t(AACITable[id].name)}` : ''}
            </span>
            <span>
              <Trans count={AACITable[id].fixed}>main:Shot down</Trans>
            </span>
            <span style={{ marginLeft: '2ex'}}>
              <Trans count={AACITable[id].modifier}>main:Modifier</Trans>
            </span>
          </div>
        )
      }
      {
        currentMax < maxShotdown && <span><Trans>main:Max shot down not reached</Trans></span>
      }
    </Fragment>
  )

  return(
    AACIs.length ?
      <span className="ship-aaci">
        <OverlayTrigger placement="top" overlay={<Tooltip className="info-tooltip" id={`aaci-info-${shipId}`}>{tooltip}</Tooltip>}>
          <Label bsStyle='warning'><Trans>main:AACI</Trans></Label>
        </OverlayTrigger>
      </span>
      : <span />
  )
})

export default AACIIndicator
