// Game webview preload. Runs with `contextIsolation: true`, so this file executes in the
// isolated world (it keeps Node / `@electron/remote` access), while the page-facing hacks
// are pushed into the page's main world via `contextBridge.executeInMainWorld`. The two
// worlds communicate through the `poiPreloadBridge` exposed below.
const remote = require('@electron/remote')
const { contextBridge } = require('electron')

const gameAPIBroadcaster = remote.require('./lib/game-api-broadcaster')
const config = remote.require('./lib/config')

const { installCapturePage } = require('./capture-page')
// Requiring cookie-hack also installs the isolated-world cookie/UA/redirect handling.
const { installPageHooks } = require('./cookie-hack')
const { installDisableTab } = require('./disable-tab')
const { installPageAlign } = require('./page-align')
const { createResourceResolver, installResourceHack } = require('./resource-hack')
const { installXhrHack } = require('./xhr-hack')

const toRequestInfo = (pathname, responseURL) => [undefined, pathname, responseURL]

// The bridge is reachable by any script on the (untrusted) game page, so validate inputs
// before handing them to the broadcaster. This bounds the surface to game-shaped traffic;
// it cannot fully prevent a hostile in-page script from forging plausible API events, since
// the legitimate game emits the same calls. Downstream consumers additionally filter to
// `/kcsapi` and require valid JSON.
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH', 'OPTIONS'])
const isAllowedMethod = (method) =>
  typeof method === 'string' && ALLOWED_METHODS.has(method.toUpperCase())
// Covers both `/kcsapi/*` and the `/kcs2/js/main.js` game-start marker.
const isGamePath = (pathname) => typeof pathname === 'string' && pathname.startsWith('/kcs')

// Privileged API bridged into the page's main world. All Node / `@electron/remote` access
// stays here in the isolated world; the main-world hacks call back through it.
contextBridge.exposeInMainWorld('poiPreloadBridge', {
  sendRequest: (method, pathname, responseURL, request) => {
    if (!isAllowedMethod(method) || !isGamePath(pathname) || typeof responseURL !== 'string') {
      return
    }
    gameAPIBroadcaster.sendRequest(method, toRequestInfo(pathname, responseURL), request)
  },
  sendResponse: (method, pathname, responseURL, request, response, responseType, status) => {
    if (!isAllowedMethod(method) || !isGamePath(pathname) || typeof responseURL !== 'string') {
      return
    }
    gameAPIBroadcaster.sendResponse(
      method,
      toRequestInfo(pathname, responseURL),
      request,
      response,
      responseType,
      status,
    )
  },
  sendError: (pathname, responseURL, status) => {
    if (typeof responseURL !== 'string') {
      return
    }
    gameAPIBroadcaster.sendError(toRequestInfo(pathname, responseURL), status)
  },
  resolveHackedResource: createResourceResolver(remote),
  isNetworkAlertDisabled: () => config.get('poi.misc.disablenetworkalert', false),
  getHomepageHost: () => {
    try {
      return new URL(config.get('poi.misc.homepage', config.getDefault('poi.misc.homepage'))).host
    } catch (_e) {
      return ''
    }
  },
})

// Install a page-facing hack in the main world. `executeInMainWorld` is experimental, so a
// failure is logged rather than allowed to abort the rest of the preload.
const installInMainWorld = (name, func) => {
  try {
    contextBridge.executeInMainWorld({ func })
  } catch (e) {
    console.error(`[poi] failed to install ${name} in the game page's main world`, e)
  }
}

// The XHR hack is installed first so the game's own requests are intercepted from
// document-start.
installInMainWorld('xhr-hack', installXhrHack)
installInMainWorld('resource-hack', installResourceHack)
installInMainWorld('page-align', installPageAlign)
installInMainWorld('capture-page', installCapturePage)
installInMainWorld('disable-tab', installDisableTab)
installInMainWorld('page-hooks', installPageHooks)
