const remote = require('@electron/remote')
const url = require('url')
const gameAPIBroadcaster = remote.require('./lib/game-api-broadcaster')

// Keep hack function in case child iframe failed to load xhr hack
window.hackXhr = (win = window) => {
  if (win.xhrHacked) {
    return false
  }

  const OriginalXMLHttpRequest = win.XMLHttpRequest

  win.XMLHttpRequest = class XMLHttpRequest extends OriginalXMLHttpRequest {
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
        gameAPIBroadcaster.sendRequest(
          this.method,
          [undefined, url.parse(responseURL).pathname, responseURL],
          this.request,
        )
      })
      this.addEventListener('loadend', () => {
        if (!this.responseType || ['json', 'text'].includes(this.responseType)) {
          gameAPIBroadcaster.sendResponse(
            this.method,
            [undefined, url.parse(this.responseURL).pathname, this.responseURL],
            this.request,
            this.response,
            this.responseType,
            this.status,
          )
        }
      })
      this.addEventListener('error', () => {
        const responseURL = this.responseURL || this.requestURL
        gameAPIBroadcaster.sendError(
          [undefined, url.parse(responseURL).pathname, responseURL],
          this.status,
        )
      })
    }

    open(method, requestURL, ...props) {
      this.method = method
      this.requestURL = requestURL
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
