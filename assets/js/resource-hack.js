// ISOLATED WORLD
// Builds the privileged resolver used by the page-side image/login-script hacks. Returns a
// poi-cache:// URL (served by the main process, lib/kcs-resource.ts) for any local hacked or
// cached resource, else undefined so the original network request proceeds.
const createResourceResolver = (remote) => {
  const { isStaticResource, findHackFilePath } = require('./kcs-resource-path')

  const config = remote.require('./lib/config')

  return (absoluteUrl = '') => {
    try {
      const { pathname } = new URL(absoluteUrl)
      if (!isStaticResource(pathname)) {
        return undefined
      }
      const cacheDir = config.get('poi.misc.cache.path', remote.getGlobal('DEFAULT_CACHE_PATH'))
      const filePath = findHackFilePath(cacheDir, decodeURIComponent(pathname))
      return filePath ? `poi-cache://resource${pathname}` : undefined
    } catch (_e) {
      return undefined
    }
  }
}

// MAIN WORLD
// Serialized into the page's main world via `contextBridge.executeInMainWorld`.
// Must stay self-contained: only reference globals and `window.poiPreloadBridge`.
function installResourceHack() {
  const bridge = window.poiPreloadBridge

  // Keep hack function in case child iframe failed to load resource hack
  window.hackResource = (win = window) => {
    if (win.resourceHacked) {
      return false
    }

    // Image hack. Hacked art is drawn onto the game's WebGL canvas, so it must be loaded
    // CORS-clean to avoid tainting the texture (which would make texImage2D throw). The
    // poi-cache:// response sends `Access-Control-Allow-Origin: *`; pairing that with
    // `crossOrigin = 'anonymous'` here makes the cross-origin image safe for WebGL. Only
    // hacked images are touched, so same-origin network images keep loading unchanged.
    const OriginalImage = win.Image
    win.Image = class HackedImage extends OriginalImage {
      constructor(...props) {
        super(...props)
      }

      get src() {
        return super.src
      }

      set src(imgSrc) {
        if (imgSrc) {
          const absoluteUrl = new URL(imgSrc, win.location.href).href
          const hackedUrl = bridge.resolveHackedResource(absoluteUrl)
          if (hackedUrl) {
            super.crossOrigin = 'anonymous'
            super.src = hackedUrl
            return
          }
        }
        super.src = imgSrc
      }
    }

    // Script load-failure fallback. Proactive cached serving is restricted to `.hack.*`
    // overrides in the main process (a stale plain-cached script would break the
    // version-pinned gadget login), so the plain cache is only used here, as a recovery when
    // a `/kcs*` script actually fails to load from the network. Resource `error` events do
    // not bubble, so this must listen in the capture phase. `resolveHackedResource` returns a
    // poi-cache:// URL only when a local file exists (hacked or plain cached).
    win.addEventListener(
      'error',
      (e) => {
        const el = e.target
        if (el && el.tagName === 'SCRIPT' && el.src && !el.dataset.poiResourceRetried) {
          const hackedUrl = bridge.resolveHackedResource(el.src)
          if (hackedUrl) {
            const script = win.document.createElement('script')
            script.src = hackedUrl
            script.dataset.poiResourceRetried = '1'
            if (el.parentNode) {
              el.parentNode.insertBefore(script, el.nextSibling)
            } else {
              win.document.body.appendChild(script)
            }
          }
        }
      },
      true,
    )

    // Login script hack
    const onError = (e) => {
      if (e.message.includes('kcsLogin_StartLogin')) {
        win.removeEventListener('error', onError)
        let scriptReloaded = false
        win.document.querySelectorAll('script').forEach((element) => {
          const absoluteUrl = new URL(element.src, win.location.href).href
          const hackedUrl = bridge.resolveHackedResource(absoluteUrl)
          if (hackedUrl) {
            const script = win.document.createElement('script')
            script.type = 'text/javascript'
            script.src = hackedUrl
            win.document.body.appendChild(script)
            scriptReloaded = true
          }
        })
        if (scriptReloaded) {
          let attempts = 0
          const interval = setInterval(() => {
            if (win.gadgets && win.kcsLogin_StartLogin) {
              win.gadgets.util.registerOnLoadHandler(win.kcsLogin_StartLogin)
              win.gadgets.util.runOnLoadHandlers()
              clearInterval(interval)
            } else if (++attempts >= 20) {
              clearInterval(interval)
            }
          }, 500)
        }
      }
    }
    win.addEventListener('error', onError)

    win.resourceHacked = true

    return true
  }

  window.hackResource()
}

module.exports = { createResourceResolver, installResourceHack }
