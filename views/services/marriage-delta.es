import React from 'react'
import FontAwesome from 'react-fontawesome'
import i18next from 'views/env-parts/i18next'

const { getStore, config } = window

/*
  either null or {id: <ship id (number)>, kyouka: <raw array of api_kyouka>}
 */
let kyoukaState = null

const onRequest = (e) => {
  if (e.detail.path === '/kcsapi/api_req_kaisou/marriage') {
    const { api_id } = e.detail.body
    const kyouka = getStore(`info.ships.${api_id}.api_kyouka`)
    if (Array.isArray(kyouka)) {
      kyoukaState = { id: Number(api_id), kyouka }
    }
  }
}

const onResponse = (e) => {
  if (e.detail.path === '/kcsapi/api_req_kaisou/marriage') {
    const {
      api_kyouka: newKyouka,
      api_lucky: [curLuck, maxLuck],
      api_id,
    } = e.detail.body
    if (kyoukaState !== null && kyoukaState.id === api_id) {
      const luckDiff = newKyouka[4] - kyoukaState.kyouka[4]
      const remaining = maxLuck - curLuck
      if (luckDiff > 0) {
        const msg = (
          <span key="luck" style={{ margin: '0 6px' }}>
            {i18next.t('Luck')}
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

if (config.get('feature.marriageDelta.enable', true)) {
  window.addEventListener('game.request', onRequest)
  window.addEventListener('game.response', onResponse)
}
