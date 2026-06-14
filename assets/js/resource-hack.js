const STATIC_RESOURCE_PATH_LIST = ['/kcs/', '/kcs2/', '/gadget_html5/']

// ISOLATED WORLD
// Builds the privileged resolver. All Node (`fs`/`path`) and `@electron/remote`
// access stays in the preload's isolated world; the main-world Image/script hack
// reaches it through `window.poiPreloadBridge.resolveHackedResource`.
const createResourceResolver = (remote) => {
  const fs = require('fs')
  const path = require('path-extra')
  const url = require('url')

  const config = remote.require('./lib/config')

  const isStaticResource = (pathname = '') =>
    typeof pathname === 'string' &&
    STATIC_RESOURCE_PATH_LIST.some((basePath) => pathname.startsWith(basePath))

  const getCachePath = (pathname = '') => {
    const dir = config.get('poi.misc.cache.path', remote.getGlobal('DEFAULT_CACHE_PATH'))
    return path.join(dir, pathname)
  }

  const findHackFilePath = (pathname = '') => {
    const originFilePath = getCachePath(path.join('KanColle', pathname))
    const sp = originFilePath.split('.')
    const ext = sp.pop()
    sp.push('hack')
    if (ext) {
      sp.push(ext)
    }
    const hackedFilePath = sp.join('.')
    try {
      fs.accessSync(hackedFilePath, fs.constants.R_OK)
      return hackedFilePath
    } catch (_e) {
      try {
        fs.accessSync(originFilePath, fs.constants.R_OK)
        return originFilePath
      } catch (_e) {
        return undefined
      }
    }
  }

  const pathToFileURL = (filePath = '') =>
    url.pathToFileURL(filePath.split(path.sep).join(path.posix.sep)).href

  // Returns a file:// URL string for a local (hacked or cached) resource, else undefined.
  return (absoluteUrl = '') => {
    try {
      const { pathname } = new URL(absoluteUrl)
      if (!isStaticResource(pathname)) {
        return undefined
      }
      const filePath = findHackFilePath(pathname)
      return filePath ? pathToFileURL(filePath) : undefined
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

    // Image hack
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
            super.src = hackedUrl
            return
          }
        }
        super.src = imgSrc
      }
    }

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
          const interval = setInterval(() => {
            if (win.gadgets && win.kcsLogin_StartLogin) {
              win.gadgets.util.registerOnLoadHandler(win.kcsLogin_StartLogin)
              win.gadgets.util.runOnLoadHandlers()
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
