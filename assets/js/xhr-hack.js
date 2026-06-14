// MAIN WORLD
// Serialized into the page's main world via `contextBridge.executeInMainWorld` so the
// replaced XMLHttpRequest intercepts the game's own requests. Must stay self-contained:
// only reference globals and `window.poiPreloadBridge`.
function installXhrHack() {
  const bridge = window.poiPreloadBridge

  const toPathname = (rawUrl) => {
    try {
      return new URL(rawUrl).pathname
    } catch (_e) {
      return undefined
    }
  }

  // Keep hack function in case child iframe failed to load xhr hack
  window.hackXhr = (win = window) => {
    if (win.xhrHacked) {
      return false
    }

    const OriginalXMLHttpRequest = win.XMLHttpRequest

    win.XMLHttpRequest = class HackedXMLHttpRequest extends OriginalXMLHttpRequest {
      constructor() {
        super()

        this.method = 'GET'
        this.requestURL = ''
        this.request = ''
        this.responseHack = undefined
        this.responseTextHack = undefined
        this.responseXMLHack = undefined

        this.addEventListener('load', () => {
          const responseURL = this.responseURL || this.requestURL
          bridge.sendRequest(this.method, toPathname(responseURL), responseURL, this.request)
        })
        this.addEventListener('loadend', () => {
          if (!this.responseType || ['json', 'text'].includes(this.responseType)) {
            bridge.sendResponse(
              this.method,
              toPathname(this.responseURL),
              this.responseURL,
              this.request,
              this.response,
              this.responseType,
              this.status,
            )
          }
        })
        this.addEventListener('error', () => {
          const responseURL = this.responseURL || this.requestURL
          bridge.sendError(toPathname(responseURL), responseURL, this.status)
        })
      }

      open(method, requestURL, ...props) {
        this.method = method
        this.requestURL = new URL(requestURL, win.location.href).href
        super.open(method, requestURL, ...props)
      }

      send(body) {
        this.request = body
        super.send(body)
      }

      get response() {
        return this.responseHack || super.response
      }

      set response(response) {
        this.responseHack = response
      }

      get responseText() {
        return this.responseTextHack || super.responseText
      }

      set responseText(responseText) {
        this.responseTextHack = responseText
      }

      get responseXML() {
        return this.responseXMLHack || super.responseXML
      }

      set responseXML(responseXML) {
        this.responseXMLHack = responseXML
      }
    }

    win.xhrHacked = true

    return true
  }

  window.hackXhr()
}

module.exports = { installXhrHack }
