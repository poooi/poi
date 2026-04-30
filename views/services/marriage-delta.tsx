import type { APIReqKaisouMarriageRequest, APIReqKaisouMarriageResponse } from 'kcsapi'
import type { GameRequestDetails, GameResponseDetails } from 'views/env-parts/data-resolver'

import React from 'react'
import FontAwesome from 'react-fontawesome'
import { getStore } from 'views/create-store'
import { config } from 'views/env-parts/config'
import i18next from 'views/env-parts/i18next'

interface KyoukaState {
  id: number
  kyouka: number[]
}

let kyoukaState: KyoukaState | null = null

const onRequest = (e: CustomEvent<GameRequestDetails>) => {
  if (e.detail.path === '/kcsapi/api_req_kaisou/marriage') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const { api_id } = e.detail.body as unknown as APIReqKaisouMarriageRequest
    const kyouka = getStore(`info.ships`)[Number(api_id)]?.api_kyouka
    if (Array.isArray(kyouka)) {
      kyoukaState = { id: Number(api_id), kyouka }
    }
  }
}

const onResponse = (e: CustomEvent<GameResponseDetails>) => {
  if (e.detail.path === '/kcsapi/api_req_kaisou/marriage') {
    const {
      api_kyouka: newKyouka,
      api_lucky: [curLuck, maxLuck],
      api_id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    } = e.detail.body as unknown as APIReqKaisouMarriageResponse
    if (kyoukaState !== null && kyoukaState.id === api_id) {
      const luckDiff = newKyouka[4] - kyoukaState.kyouka[4]
      const remaining = maxLuck - curLuck
      if (luckDiff > 0) {
        const msg = (
          <span key="luck" style={{ margin: '0 6px' }}>
            {String(i18next.t('Luck'))}
            <FontAwesome
              name={
                /* expected range of luckDiff is 3~6, we'll consider > 4 double */
                remaining <= 0 || luckDiff > 4 ? 'angle-double-up' : 'angle-up'
              }
              style={{ margin: '0 3px' }}
            />
            {luckDiff}/
            <span style={{ fontSize: '80%', verticalAlign: 'baseline' }}>
              {remaining <= 0 ? 'MAX' : `+${remaining}`}
            </span>
          </span>
        )
        setTimeout(window.success, 100, msg)
      }
    }
    kyoukaState = null
  }
}

if (config.get('poi.marriageDelta.enable', true)) {
  window.addEventListener('game.request', onRequest)
  window.addEventListener('game.response', onResponse)
}
