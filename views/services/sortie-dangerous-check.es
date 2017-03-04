import {damagedCheck} from './utils'

const {i18n, getStore, toggleModal} =  window

const __ = i18n.main.__.bind(i18n.main)

window.addEventListener('game.response', ({detail: {path, body, postBody}}) => {
  if (path === '/kcsapi/api_req_map/start' || path === '/kcsapi/api_req_map/next') {
    // const {$ships, $equips} = getStore('const') || {}
    // const {sortieStatus, escapedPos} = getStore('sortie') || {}
    // const {fleets, ships, equips} = getStore('info') || {}
    const damagedShips = damagedCheck(getStore('const'), getStore('sortie'), getStore('info'))
    if (damagedShips.length > 0) {
      return toggleModal(__('Attention!'), damagedShips.join(' ') + __('is heavily damaged!'))
    }
  }
})
