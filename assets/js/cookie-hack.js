// ISOLATED WORLD
// Cookie/User-Agent/redirect handling needs `@electron/remote` + config, so it runs in
// the preload's isolated world. `document.cookie`, `location` and cookies are shared
// across worlds, so mutating them here still affects the page.
const remote = require('@electron/remote')

const config = remote.require('./lib/config')

document.addEventListener('DOMContentLoaded', () => {
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
    document.cookie = `ckcy_remedied_check=ec_mrnhbtk;expires=${expires};domain=osapi.dmm.com;path=/`
    document.cookie = `ckcy_remedied_check=ec_mrnhbtk;expires=${expires};domain=203.104.209.7;path=/`
    document.cookie = `ckcy_remedied_check=ec_mrnhbtk;expires=${expires};domain=www.dmm.com;path=/netgame/`
    document.cookie = `ckcy_remedied_check=ec_mrnhbtk;expires=${expires};domain=log-netgame.dmm.com;path=/`
    document.cookie = `ckcy_remedied_check=ec_mrnhbtk;expires=${expires};domain=.dmm.com;path=/`
    document.cookie = `ckcy_remedied_check=ec_mrnhbtk;expires=${expires};domain=.dmm.com;path=/netgame/`
    document.cookie = `ckcy_remedied_check=ec_mrnhbtk;expires=${expires};domain=.dmm.com;path=/netgame_s/`

    const ua = remote.getCurrentWebContents().session.getUserAgent()
    remote.getCurrentWebContents().session.setUserAgent(ua, 'ja-JP')

    // Workaround for re-navigate from foreign page on first visit
    if (location.href.includes('/foreign/')) {
      location.href = config.getDefault('poi.misc.homepage')
    }
  }
})

// MAIN WORLD
// Overriding the page's `confirm`/`document.write`/`DMM` globals must happen in the page's
// own world. Serialized via `contextBridge.executeInMainWorld`; keep it self-contained and
// only reference globals and `window.poiPreloadBridge`.
function installPageHooks() {
  const bridge = window.poiPreloadBridge

  document.addEventListener('DOMContentLoaded', () => {
    if (bridge.isNetworkAlertDisabled()) {
      window.confirmBackup = window.confirm
      window.confirm = () => {}
      if (window.DMM?.netgame?.reloadDialog) {
        window.DMM.netgame.reloadDialog = () => {}
      }
    }
  })

  // Only guard document.write on the configured game host (derived from the homepage),
  // rather than a single hardcoded URL that silently breaks when DMM changes the game URL.
  const homepageHost = bridge.getHomepageHost()
  if (homepageHost && location.host === homepageHost) {
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
}

module.exports = { installPageHooks }
