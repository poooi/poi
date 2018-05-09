/* global ga */

import { observer, observe } from 'redux-observers'
import { store } from 'views/create-store'

let heartbeat = null

const handleMemberIdChange = (dispatch, current, previous) => {
  ga('set', 'userId', current)
  ga('send', 'pageview')
  if (!heartbeat) {
    heartbeat = setInterval(() => {
      ga('send', 'event', 'heartbeat')
    }, 240000)
  }
}

const memberIdObserver = observer(
  (state) => state.info.basic.api_member_id,
  handleMemberIdChange,
)

if (window.config.get('poi.sendAnalytics', true)) {
  if (window.getStore('info.basic.api_member_id')) {
    handleMemberIdChange(null, window.getStore('info.basic.api_member_id'))
  }
  observe(store, [ memberIdObserver ])
}
