import type { Mime } from 'mime'

import { net, protocol, session } from 'electron'
import { constants, promises as fsp } from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

import config from './config'
import { warn } from './utils'

// Shared, plain-JS cache-path logic (also used by the webview preload's isolated world).
// Required by absolute path because the main process only babel-registers .es/.ts/.tsx.
const kcsResourcePath: {
  isStaticResource: (pathname?: string) => boolean
  getCacheCandidatePaths: (cacheDir: string, pathname?: string) => [string, string]
} = require(path.join(ROOT, 'assets', 'js', 'kcs-resource-path'))

const { isStaticResource, getCacheCandidatePaths } = kcsResourcePath

// Privileged scheme used to serve hacked/cached KanColle assets to the game page. `secure`
// + `bypassCSP` let it load into the https game page without mixed-content/CSP blocks, and
// `corsEnabled` (paired with the ACAO header below) keeps the game canvas untainted so
// canvas-based screenshots keep working.
const SCHEME = 'poi-cache'

// Set Content-Type explicitly rather than relying on net.fetch's file:// inference, so served
// assets always carry a usable type. `mime` v4 is ESM-only; load it via native dynamic import
// (babel keeps import() for poi's own files) and cache the instance.
let mimePromise: Promise<Mime> | undefined
const getMime = () => {
  if (!mimePromise) {
    mimePromise = import('mime').then((m) => m.default)
  }
  return mimePromise
}

// Resource types that may be swapped here. Images are excluded: they are handled page-side
// (resource-hack.js) where `crossOrigin` can be set so the game's WebGL canvas stays
// untainted. `xhr`/documents are excluded too — the gadget login flow evals XHR bodies, so
// serving a cached file there breaks login.
const HACKABLE_RESOURCE_TYPES = new Set(['stylesheet', 'media', 'font', 'script'])
// `script` only accepts explicit `.hack.*` overrides, never the plain cached origin file:
// scripts are version-pinned (main.js?version=...) and the gadget login does script-based
// RPC under /gadget_html5/, so serving a stale/wrong cached script breaks login (the page
// evals it → SyntaxError). A `.hack.js` is a deliberate, version-independent user override.
const OVERRIDE_ONLY_RESOURCE_TYPES = new Set(['script'])

const getCacheDir = () => config.get('poi.misc.cache.path', DEFAULT_CACHE_PATH)

const findHackFilePathAsync = async (
  cacheDir: string,
  pathname: string,
  overrideOnly = false,
): Promise<string | undefined> => {
  const [hackedFilePath, originFilePath] = getCacheCandidatePaths(cacheDir, pathname)
  const candidates = overrideOnly ? [hackedFilePath] : [hackedFilePath, originFilePath]
  for (const candidate of candidates) {
    try {
      await fsp.access(candidate, constants.R_OK)
      return candidate
    } catch (_e) {
      // try next candidate
    }
  }
  return undefined
}

// Must run before app `ready`.
export const registerKcsResourceScheme = () => {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        bypassCSP: true,
        stream: true,
      },
    },
  ])
}

// Must run after app `ready`.
export const registerKcsResourceProtocol = () => {
  const ses = session.defaultSession

  // Redirect game static-resource requests to the poi-cache scheme when a local hacked or
  // cached file exists; otherwise let them hit the network untouched.
  ses.webRequest.onBeforeRequest(
    { urls: ['*://*/kcs/*', '*://*/kcs2/*', '*://*/gadget_html5/*'] },
    async (details, callback) => {
      try {
        if (!HACKABLE_RESOURCE_TYPES.has(details.resourceType)) {
          callback({})
          return
        }
        const { pathname } = new URL(details.url)
        if (!isStaticResource(pathname)) {
          callback({})
          return
        }
        const overrideOnly = OVERRIDE_ONLY_RESOURCE_TYPES.has(details.resourceType)
        const filePath = await findHackFilePathAsync(
          getCacheDir(),
          decodeURIComponent(pathname),
          overrideOnly,
        )
        if (filePath) {
          callback({ redirectURL: `${SCHEME}://resource${pathname}` })
        } else {
          callback({})
        }
      } catch (_e) {
        callback({})
      }
    },
  )

  // Serve the resolved local file. Resolution is re-done from the request pathname (never a
  // page-supplied file path) and clamped to the cache dir, so the page cannot read arbitrary
  // files through this scheme.
  ses.protocol.handle(SCHEME, async (request) => {
    try {
      const { pathname } = new URL(request.url)
      const decodedPathname = decodeURIComponent(pathname)
      if (!isStaticResource(decodedPathname)) {
        return new Response(null, { status: 404 })
      }
      const cacheDir = getCacheDir()
      const filePath = await findHackFilePathAsync(cacheDir, decodedPathname)
      if (!filePath) {
        return new Response(null, { status: 404 })
      }
      const resolved = path.resolve(filePath)
      if (!resolved.startsWith(path.resolve(cacheDir) + path.sep)) {
        warn('kcs-resource: refusing to serve path outside cache dir', resolved)
        return new Response(null, { status: 403 })
      }
      const fileResponse = await net.fetch(pathToFileURL(resolved).href)
      const headers = new Headers(fileResponse.headers)
      headers.set('Access-Control-Allow-Origin', '*')
      const contentType = (await getMime()).getType(resolved)
      if (contentType) {
        headers.set('Content-Type', contentType)
      }
      return new Response(fileResponse.body, {
        status: fileResponse.status,
        statusText: fileResponse.statusText,
        headers,
      })
    } catch (e) {
      warn('kcs-resource: failed to serve', request.url, e)
      return new Response(null, { status: 500 })
    }
  })
}
