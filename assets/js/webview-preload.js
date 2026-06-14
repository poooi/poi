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

// Privileged API bridged into the page's main world. All Node / `@electron/remote` access
// stays here in the isolated world; the main-world hacks call back through it.
contextBridge.exposeInMainWorld('poiPreloadBridge', {
  sendRequest: (method, pathname, responseURL, request) => {
    gameAPIBroadcaster.sendRequest(method, toRequestInfo(pathname, responseURL), request)
  },
  sendResponse: (method, pathname, responseURL, request, response, responseType, status) => {
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
    gameAPIBroadcaster.sendError(toRequestInfo(pathname, responseURL), status)
  },
  resolveHackedResource: createResourceResolver(remote),
  isNetworkAlertDisabled: () => config.get('poi.misc.disablenetworkalert', false),
})

// Install the page-facing hacks in the main world. The XHR hack is installed first so the
// game's own requests are intercepted from document-start.
contextBridge.executeInMainWorld({ func: installXhrHack })
contextBridge.executeInMainWorld({ func: installResourceHack })
contextBridge.executeInMainWorld({ func: installPageAlign })
contextBridge.executeInMainWorld({ func: installCapturePage })
contextBridge.executeInMainWorld({ func: installDisableTab })
contextBridge.executeInMainWorld({ func: installPageHooks })
