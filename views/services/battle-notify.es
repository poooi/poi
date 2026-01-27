/* global config, notify, ROOT */
import * as remote from '@electron/remote'
import { join } from 'path-extra'
import { parse } from 'url'
import i18next from 'views/env-parts/i18next'

import { ResourceNotifier } from './resource-notifier'

let inBattle = false

const needNotification = (inBattle) => {
  const enabled = config.get('poi.notify.battleEnd.enabled')
  const noticeOnlyBackground = config.get('poi.notify.battleEnd.onlyBackground')
  const noticeOnlyMuted = config.get('poi.notify.battleEnd.onlyMuted')
  const poiMuted = config.get('poi.content.muted')
  const poiFocused =
    remote.getCurrentWindow().isFocused() ||
    remote.BrowserWindow.getAllWindows().some(
      (win) => win.getURL().endsWith('?kangame') && win.isFocused(),
    )
  if (!inBattle) {
    // no need notice because not battling
    return false
  }
  if (!enabled) {
    // not enabled
    return false
  }
  if (noticeOnlyMuted && !poiMuted) {
    // no need notice because noticeOnlyMuted
    return false
  }
  if (noticeOnlyBackground && poiFocused) {
    // no need notice because noticeOnlyBackground
    return false
  }
  return true
}

ResourceNotifier.addListener('request', (detail) => {
  const { pathname } = parse(detail.url)
  switch (pathname) {
    case '/kcsapi/api_req_practice/battle':
    case '/kcsapi/api_req_sortie/battle':
    case '/kcsapi/api_req_sortie/airbattle':
    case '/kcsapi/api_req_sortie/ld_airbattle':
    case '/kcsapi/api_req_sortie/ld_shooting':
    case '/kcsapi/api_req_combined_battle/battle':
    case '/kcsapi/api_req_combined_battle/battle_water':
    case '/kcsapi/api_req_combined_battle/airbattle':
    case '/kcsapi/api_req_combined_battle/ld_airbattle':
    case '/kcsapi/api_req_combined_battle/ld_shooting':
    case '/kcsapi/api_req_combined_battle/ec_battle':
    case '/kcsapi/api_req_combined_battle/each_battle':
    case '/kcsapi/api_req_combined_battle/each_battle_water':
    case '/kcsapi/api_req_practice/midnight_battle':
    case '/kcsapi/api_req_battle_midnight/battle':
    case '/kcsapi/api_req_battle_midnight/sp_midnight':
    case '/kcsapi/api_req_combined_battle/midnight_battle':
    case '/kcsapi/api_req_combined_battle/sp_midnight':
    case '/kcsapi/api_req_combined_battle/ec_midnight_battle': {
      inBattle = true
      break
    }
    // Battle Result
    case '/kcsapi/api_req_practice/battle_result':
    case '/kcsapi/api_req_sortie/battleresult':
    case '/kcsapi/api_req_combined_battle/battleresult': {
      inBattle = false
      break
    }
    case '/kcs2/resources/se/217.mp3': {
      if (needNotification(inBattle)) {
        notify(i18next.t('others:Battle is over'), {
          type: 'battleEnd',
          icon: join(ROOT, 'assets', 'img', 'operation', 'sortie.png'),
        })
      }
    }
  }
})
