// Shared cache-path logic for the KanColle static-resource hack. Plain CommonJS with no
// Electron deps so it can be required from both the main process (lib/kcs-resource.ts) and
// the webview preload's isolated world (resource-hack.js).
const fs = require('fs')
const path = require('path-extra')

const STATIC_RESOURCE_PATH_LIST = ['/kcs/', '/kcs2/', '/gadget_html5/']

const isStaticResource = (pathname = '') =>
  typeof pathname === 'string' &&
  STATIC_RESOURCE_PATH_LIST.some((basePath) => pathname.startsWith(basePath))

// Candidate on-disk paths for a `/kcs*` pathname under the cache dir: the `.hack.<ext>`
// override variant (preferred) and the plain cached origin file.
const getCacheCandidatePaths = (cacheDir, pathname = '') => {
  const originFilePath = path.join(cacheDir, 'KanColle', pathname)
  const sp = originFilePath.split('.')
  const ext = sp.pop()
  sp.push('hack')
  if (ext) {
    sp.push(ext)
  }
  return [sp.join('.'), originFilePath]
}

// Synchronous resolve (used off the hot path, e.g. login-script reinjection).
const findHackFilePath = (cacheDir, pathname = '') => {
  const [hackedFilePath, originFilePath] = getCacheCandidatePaths(cacheDir, pathname)
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

module.exports = {
  STATIC_RESOURCE_PATH_LIST,
  isStaticResource,
  getCacheCandidatePaths,
  findHackFilePath,
}
