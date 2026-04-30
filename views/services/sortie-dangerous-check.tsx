import { getStore } from 'views/create-store'
import i18next from 'views/env-parts/i18next'
import { toggleModal } from 'views/env-parts/modal'

import { damagedCheck } from './utils'

window.addEventListener('game.response', (e) => {
  const { path } = e.detail
  if (path === '/kcsapi/api_req_map/start' || path === '/kcsapi/api_req_map/next') {
    const damagedShips = damagedCheck(getStore('const'), getStore('sortie'), getStore('info'))
    if (damagedShips.length > 0) {
      toggleModal(
        i18next.t('main:Attention!'),
        damagedShips.join(' ') + ' ' + i18next.t('main:is heavily damaged!'),
        [],
      )
    }
  }
})
