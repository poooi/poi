const remote = require('@electron/remote')
const fs = require('fs')
const path = require('path-extra')
const url = require('url')

const config = remote.require('./lib/config')

const STATIC_RESOURCE_PATH_LIST = ['/kcs/', '/kcs2/', '/gadget_html5/']

const isStatisResource = (pathname = '') =>
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
  } catch (e) {
    try {
      fs.accessSync(originFilePath, fs.constants.R_OK)
      return originFilePath
    } catch (e) {
      return undefined
    }
  }
}

const pathToFileURL = (filePath = '') =>
  url.pathToFileURL(filePath.split(path.sep).join(path.posix.sep))

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
        const { pathname } = url.parse(new URL(imgSrc, win.location.href).href)
        if (isStatisResource(pathname)) {
          const filePath = findHackFilePath(pathname)
          if (filePath) {
            super.src = pathToFileURL(filePath)
            return
          }
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
        const { pathname } = url.parse(new URL(element.src, win.location.href).href)
        if (isStatisResource(pathname)) {
          const filePath = findHackFilePath(pathname)
          if (filePath) {
            const script = win.document.createElement('script')
            script.type = 'text/javascript'
            script.src = pathToFileURL(filePath)
            win.document.body.appendChild(script)
            scriptReloaded = true
          }
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
