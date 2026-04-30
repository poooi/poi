import type { APIReqKaisouPowerupRequest, APIReqKaisouPowerupResponse } from 'kcsapi'
import type { APIMstShip } from 'kcsapi/api_start2/getData/response'
import type { GameRequestDetails, GameResponseDetails } from 'views/env-parts/data-resolver'
import type { Ship } from 'views/redux/info/ships'

import { unzip, sum } from 'lodash'
import React from 'react'
import FontAwesome from 'react-fontawesome'
import { Trans } from 'react-i18next'
import { getStore } from 'views/create-store'
import { config } from 'views/env'
import i18next from 'views/env-parts/i18next'
import { success, warn } from 'views/services/alert'
import { shipDataSelectorFactory } from 'views/utils/selectors'

const REMAINING_UNKNOWN = -10000

const nameStatuses = [
  i18next.t('Firepower'),
  i18next.t('Torpedo'),
  i18next.t('AntiAir'),
  i18next.t('Armor'),
  i18next.t('Luck'),
  i18next.t('HP'),
  i18next.t('ASW'),
]

const possibleStatusNum = nameStatuses.length

let requestRecord: Promise<(targetShipAfter: Ship & APIMstShip) => React.ReactNode> | null = null

// Multiplied by a factor of 5 to do operations in integers
const luckProviders = (id: number): number => {
  switch (id) {
    case 163:
      return 6 // Maruyu
    case 402:
      return 8 // Maruyu Kai
  }
  return 0
}

const calcMaxDelta = (lst: number[]): number => {
  const baseSum = sum(lst)
  return baseSum + Math.floor((baseSum + 1) / 5)
}

const calcMaxDeltas = (sourceShips: number[]): number[] => {
  const maxFourDeltas = unzip(
    sourceShips.map((id) => {
      const ship = getStore('const.$ships')?.[id]
      return (ship || {}).api_powup || [0, 0, 0, 0]
    }),
  ).map((delta) => calcMaxDelta(delta as number[]))
  const maxLuck = Math.ceil(sum(sourceShips.map((id) => luckProviders(id))) / 5 - 0.0001)
  return maxFourDeltas.concat([maxLuck, 0, 0])
}

const apiStatuses = [
  'api_houg',
  'api_raig',
  'api_tyku',
  'api_souk',
  'api_luck',
  // '_NODATA_',
  // '_NODATA_',
] as const

const calcRemainingStatuses = (ship: Ship & APIMstShip): number[] =>
  apiStatuses.map((apiStatus, i) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const statusPair = ship[apiStatus]
    if (!statusPair) {
      return REMAINING_UNKNOWN
    }
    const kyouka = ship.api_kyouka
    return statusPair?.[1] - (statusPair?.[0] + kyouka[i])
  })

const formatRemaining = (remaining: number): string => {
  if (remaining == REMAINING_UNKNOWN) {
    return '?'
  } else if (remaining > 0) {
    return `+${remaining}`
  } else {
    return 'MAX'
  }
}

const calcDisplayText = (
  targetShipBefore: Ship,
  sourceShips: number[],
): Promise<(targetShipAfter: Ship & APIMstShip) => React.ReactNode> => {
  const kyoukaBefore = targetShipBefore.api_kyouka.slice()
  return new Promise((resolve) => {
    const maxDeltas = calcMaxDeltas(sourceShips)
    return resolve((targetShipAfter: Ship & APIMstShip) => {
      const kyoukaAfter = targetShipAfter.api_kyouka
      const remainingAfter = calcRemainingStatuses(targetShipAfter)
      return (
        <span>
          <Trans>Modernization succeeded</Trans>
          {[...Array(possibleStatusNum).keys()].map((i) => {
            const delta = kyoukaAfter[i] - kyoukaBefore[i]
            const maxDelta = maxDeltas[i]
            const remaining = remainingAfter[i]
            return (
              ((remaining > 0 && maxDelta != 0) || delta != 0) && (
                <span key={i} style={{ margin: '0 6px' }}>
                  {nameStatuses[i]}
                  <FontAwesome
                    name={remaining <= 0 || delta >= maxDelta ? 'angle-double-up' : 'angle-up'}
                    style={{ margin: '0 3px' }}
                  />
                  {delta}/
                  <span style={{ fontSize: '80%', verticalAlign: 'baseline' }}>
                    {formatRemaining(remaining)}
                  </span>
                </span>
              )
            )
          })}
        </span>
      )
    })
  })
}

const onRequest = (e: CustomEvent<GameRequestDetails>) => {
  if (e.detail.path === '/kcsapi/api_req_kaisou/powerup') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const { api_id, api_id_items } = e.detail.body as unknown as APIReqKaisouPowerupRequest
    const sourceShips = api_id_items.split(',').map((id_item) => {
      return (getStore('info.ships')?.[Number(id_item)] || {}).api_ship_id
    })
    const [$ship, ship] = shipDataSelectorFactory(Number(api_id))(getStore()) ?? []
    if ($ship && ship) {
      requestRecord = calcDisplayText({ ...$ship, ...ship }, sourceShips)
    }
  }
}

const onResponse = (e: CustomEvent<GameResponseDetails>) => {
  if (e.detail.path === '/kcsapi/api_req_kaisou/powerup') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const body = e.detail.body as unknown as APIReqKaisouPowerupResponse
    if (body.api_powerup_flag) {
      const target = body.api_ship
      const $ship = getStore('const.$ships')?.[target.api_ship_id]
      if (requestRecord != null && $ship) {
        requestRecord.then((calcText) =>
          setTimeout(
            success,
            100,
            calcText({
              ...$ship,
              ...target,
            }),
          ),
        )
      }
    } else {
      setTimeout(warn, 100, <Trans>Modernization failed</Trans>)
    }
  }
}

if (config.get('poi.modernizationDelta.enable', true)) {
  window.addEventListener('game.request', onRequest)
  window.addEventListener('game.response', onResponse)
}
