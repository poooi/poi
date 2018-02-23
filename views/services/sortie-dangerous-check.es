import {damagedCheck} from './utils'
import { Trans } from 'react-i18next'
import React from 'react'

const { getStore, toggleModal } =  window

window.addEventListener('game.response', ({detail: {path, body, postBody}}) => {
  if (path === '/kcsapi/api_req_map/start' || path === '/kcsapi/api_req_map/next') {
    // const {$ships, $equips} = getStore('const') || {}
    // const {sortieStatus, escapedPos} = getStore('sortie') || {}
    // const {fleets, ships, equips} = getStore('info') || {}
    const damagedShips = damagedCheck(getStore('const'), getStore('sortie'), getStore('info'))
    if (damagedShips.length > 0) {
      return toggleModal(<Trans>main:Attention!</Trans>, <>{damagedShips.join(' ')} <Trans>main:is heavily damaged!</Trans></>)
    }
  }
})
