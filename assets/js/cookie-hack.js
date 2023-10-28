const remote = require('@electron/remote')
const config = remote.require('./lib/config')

document.addEventListener('DOMContentLoaded', (e) => {
  if (config.get('poi.misc.dmmcookie', false) && location.hostname.includes('dmm')) {
    const now = new Date()
    now.setFullYear(now.getFullYear() + 1)
    const expires = now.toUTCString()
    document.cookie = `cklg=welcome;expires=${expires};domain=.dmm.com;path=/`
    document.cookie = `cklg=welcome;expires=${expires};domain=.dmm.com;path=/netgame/`
    document.cookie = `cklg=welcome;expires=${expires};domain=.dmm.com;path=/netgame_s/`
    document.cookie = `ckcy=1;expires=${expires};domain=osapi.dmm.com;path=/`
    document.cookie = `ckcy=1;expires=${expires};domain=203.104.209.7;path=/`
    document.cookie = `ckcy=1;expires=${expires};domain=www.dmm.com;path=/netgame/`
    document.cookie = `ckcy=1;expires=${expires};domain=log-netgame.dmm.com;path=/`
    document.cookie = `ckcy=1;expires=${expires};domain=.dmm.com;path=/`
    document.cookie = `ckcy=1;expires=${expires};domain=.dmm.com;path=/netgame/`
    document.cookie = `ckcy=1;expires=${expires};domain=.dmm.com;path=/netgame_s/`
    const ua = remote.getCurrentWebContents().session.getUserAgent()
    remote.getCurrentWebContents().session.setUserAgent(ua, 'ja-JP')

    // Workaround for re-navigate from foreign page on first visit
    if (location.href.includes('/foreign/')) {
      location.href = config.getDefault('poi.misc.homepage')
    }
  }
  if (config.get('poi.misc.disablenetworkalert', false) && window.DMM) {
    window.DMM.netgame.reloadDialog = function () {}
  }
})

if (
  window.location
    .toString()
    .includes('http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/')
) {
  const _documentWrite = document.write
  document.write = function () {
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      console.warn(
        `Block document.write since document is at state "${document.readyState}". Blocked call:`,
        arguments,
      )
    } else {
      _documentWrite.apply(this, arguments)
    }
  }
}
