import React from 'react'
import FontAwesome from 'react-fontawesome'
import i18next from 'views/env-parts/i18next'
import { Trans } from 'react-i18next'

const { unzip, sum } = require('lodash')
const { config } = window


const nameStatuses = [
  i18next.t('Firepower'),
  i18next.t('Torpedo'),
  i18next.t('AntiAir'),
  i18next.t('Armor'),
  i18next.t('Luck'),
]


// Stores information in onRequest, used in onResponse
let requestRecord = null

// Multiplied by a factor of 5 to do operations in integers
const luckProviders = (id) => {
  switch (id){
  case 163:
    return 6     // Maruyu
  case 402:
    return 8     // Maruyu Kai
  }
  return 0
}

const calcMaxDelta = (lst) => {
  const baseSum = sum(lst)
  // According to the formula provided by wiki
  return baseSum + Math.floor((baseSum+1)/5)
}

// Given sourceShips, the maximum statuses addable regardless of status cap
const calcMaxDeltas = (sourceShips) => {
  const maxFourDeltas =
    unzip(sourceShips.map(id => (window.$ships[id] || {} ).api_powup || [0, 0, 0, 0]))
      .map(delta => calcMaxDelta(delta))
  const maxLuck = Math.ceil(sum(sourceShips.map(id => luckProviders(id))) / 5 - 0.0001)
  return maxFourDeltas.concat([maxLuck])
}

const apiStatuses = ['api_houg', 'api_raig', 'api_tyku', 'api_souk', 'api_luck']

const calcRemainingStatuses = (ship) =>
  [...Array(5).keys()].map(i =>
    ship[apiStatuses[i]][1] - (ship[apiStatuses[i]][0] + ship.api_kyouka[i])
  )


const calcDisplayText = (targetShipBefore, sourceShips) => {
  // Clone it because it may have been modified on response
  const kyoukaBefore = targetShipBefore.api_kyouka.slice()
  // Run unnecessary calculation in a promise to minimize the blocking of request
  return new Promise((resolve) => {
    const maxDeltas = calcMaxDeltas(sourceShips)
    return resolve((targetShipAfter) => {
      const kyoukaAfter = targetShipAfter.api_kyouka
      const remainingAfter = calcRemainingStatuses(targetShipAfter)
      return(
        <span>
          <Trans>Modernization succeeded</Trans>
          {
            [...Array(5).keys()].map(i => {
              const delta = kyoukaAfter[i] - kyoukaBefore[i]
              const maxDelta = maxDeltas[i]
              const remaining = remainingAfter[i]
              // Explaination for if condition:
              //   1st term: Something could have been added, but maybe delta == 0
              //   2nd term: Something has been added
              return (
                ((remaining > 0 && maxDelta != 0) || delta != 0) &&

              <span key={i} style={{margin: '0 6px'}}>
                {nameStatuses[i]}
                <FontAwesome
                  name={(remaining <= 0 || delta == maxDelta) ? 'angle-double-up' : 'angle-up'}
                  style={{margin: '0 3px'}}
                />
                {delta}/
                <span style={{fontSize:'80%', verticalAlign:'baseline'}}>
                  {remaining <= 0 ? 'MAX' : `+${remaining}`}
                </span>
              </span>
              )
            })
          }
        </span>
      )
    })
  })
}

const onRequest = (e) => {
  if (e.detail.path === '/kcsapi/api_req_kaisou/powerup'){
    const {api_id, api_id_items} = e.detail.body
    // Read the status before modernization, use a copy because map's callback
    // may be delayed to when ship is deleted from _ships
    const sourceShips = api_id_items.split(',').map(id_item => {
      return (window._ships[id_item] || {}).api_ship_id
    })
    requestRecord = calcDisplayText(window._ships[api_id], sourceShips)
  }
}

const onResponse = (e) => {
  if (e.detail.path === '/kcsapi/api_req_kaisou/powerup') {
    // Read the status after modernization
    if (e.detail.body.api_powerup_flag){
      const target = e.detail.body.api_ship
      if (requestRecord != null) {
        requestRecord.then((calcText) =>
          setTimeout(window.success, 100, calcText({
            ...window.$ships[target.api_ship_id],
            ...target,
          })))
      }
    } else {
      setTimeout(window.warn, 100, <Trans>Modernization failed</Trans>)
    }
  }
}

if (config.get('feature.modernization-delta.enable', true)) {
  window.addEventListener('game.request', onRequest)
  window.addEventListener('game.response', onResponse)
}
