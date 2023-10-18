const fs = require('fs')
const url = require('url')
const path = require('path-extra')
const remote = require('@electron/remote')

const config = remote.require('./lib/config')

const isStatisResource = (pathname = '') =>
  typeof pathname === 'string' && (pathname.startsWith('/kcs2/') || pathname.startsWith('/kcs/'))

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

window.hackImage = (win = window) => {
  if (win.imageHacked) {
    return false
  }

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

  win.imageHacked = true

  return true
}

window.hackImage()
