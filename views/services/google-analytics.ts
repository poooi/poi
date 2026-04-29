/* global ga */

import { observer, observe } from 'redux-observers'
import { store } from 'views/create-store'
import { config } from 'views/env-parts/config'

let heartbeat: ReturnType<typeof setInterval> | null = null

const handleMemberIdChange = (_dispatch: unknown, current: string) => {
  ga('set', 'userId', current)
  ga('send', 'pageview')
  if (!heartbeat) {
    heartbeat = setInterval(() => {
      ga('send', 'event', 'heartbeat')
    }, 240000)
  }
}

const memberIdObserver = observer(
  (state: { info: { basic: { api_member_id: string } } }) => state.info.basic.api_member_id,
  handleMemberIdChange,
)

if (config.get('poi.misc.analytics', true)) {
  if (window.getStore('info.basic.api_member_id')) {
    handleMemberIdChange(null, window.getStore('info.basic.api_member_id') ?? '')
  }
  observe(store, [memberIdObserver])
}
