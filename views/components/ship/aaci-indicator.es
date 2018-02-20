import React from 'react'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { memoize, get } from 'lodash'
import { OverlayTrigger, Tooltip, Label } from 'react-bootstrap'
import { translate, Trans } from 'react-i18next'
import i18next from 'views/env-parts/i18next'

import { shipDataSelectorFactory, shipEquipDataSelectorFactory } from 'views/utils/selectors'
import { getShipAACIs, getShipAllAACIs, AACITable } from 'views/utils/aaci'

const getAvailableTranslation = memoize(str => i18next.translator.exists(`main:${str}`) ? <Trans>main:{str}</Trans>
  : i18next.translator.exists(`resources:${str}`) ? <Trans>resources:{str}</Trans>
    : str)

const __t = name => name.map((n, i) => <span className='aaci-type-name' key={i}>{ getAvailableTranslation(n) }</span>)

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

export const AACIIndicator = translate(['main'])(connect(
  (state, { shipId }) => ({
    AACIs: AACISelectorFactory(shipId)(state) || [],
    maxShotdown: maxAACIShotdownSelectorFactory(shipId)(state),
  })
)(({ AACIs, maxShotdown, shipId, t }) => {
  const currentMax = Math.max(...AACIs.map(id => AACITable[id].fixed || 0))

  const tooltip = AACIs.length &&
  (
    <>
      {
        AACIs.map(id =>
          <div className="info-tooltip-entry" key={id}>
            <span className="info-tooltip-item">
              {t('main:AACIType', { count: id })}
              <span>{ get(AACITable, `${id}.name.length`, 0) > 0 ? __t(AACITable[id].name) : '' }</span>
            </span>
            <span>
              {t('main:Shot down', { count: AACITable[id].fixed })}
            </span>
            <span style={{ marginLeft: '2ex'}}>
              {t('main:Modifier', { count: AACITable[id].modifier })}
            </span>
          </div>
        )
      }
      {
        currentMax < maxShotdown && <span>{t('main:Max shot down not reached')}</span>
      }
    </>
  )

  return(
    AACIs.length ?
      <span className="ship-aaci">
        <OverlayTrigger placement="top" overlay={<Tooltip className="info-tooltip" id={`aaci-info-${shipId}`}>{tooltip}</Tooltip>}>
          <Label bsStyle='warning'>{t('main:AACI')}</Label>
        </OverlayTrigger>
      </span>
      : <span />
  )
}))

