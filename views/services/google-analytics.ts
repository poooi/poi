import { observer, observe } from 'redux-observers'
import { store, getStore } from 'views/create-store'
import { config } from 'views/env'

let heartbeat: ReturnType<typeof setInterval> | null = null

declare global {
  interface Window {
    ga: (...args: unknown[]) => void
  }
}

const handleMemberIdChange = (_dispatch: unknown, current: string) => {
  window.ga('set', 'userId', current)
  window.ga('send', 'pageview')
  if (!heartbeat) {
    heartbeat = setInterval(() => {
      window.ga('send', 'event', 'heartbeat')
    }, 240000)
  }
}

const memberIdObserver = observer(
  (state: { info: { basic: { api_member_id: string } } }) => state.info.basic.api_member_id,
  handleMemberIdChange,
)

if (config.get('poi.misc.analytics', true)) {
  if (getStore('info.basic.api_member_id')) {
    handleMemberIdChange(null, getStore('info.basic.api_member_id') ?? '')
  }
  observe(store, [memberIdObserver])
}
