import type * as electronType from 'electron'

import * as electronRemote from '@electron/remote/main'
import { X509Certificate, createHash } from 'crypto'
import { app, BrowserWindow, ipcMain, nativeImage, shell } from 'electron'
import fs from 'fs-extra'
import { memoize } from 'lodash'
import path from 'path'

// eslint-disable-next-line import-x/no-rename-default
import type configType from './lib/config'
import type * as kcsResourceType from './lib/kcs-resource'
import type * as sentryType from './lib/sentry'
import type shortcutType from './lib/shortcut'
import type * as touchbarType from './lib/touchbar'
import type windowManagerType from './lib/window'

import dbg from './lib/debug'
import { APPDATA_PATH, ROOT } from './lib/env'
import { setAllowedPath } from './lib/module-path'
import { warn, error } from './lib/utils'

// NOTE on module loading order: the './lib/env' import above must finish
// before any module that reads the environment globals at import time
// (config, default-config, ...). Imports execute before all statements, so
// those modules are loaded via require() below, in the original order.

const poiIconPath = path.join(
  ROOT,
  'assets',
  'icons',
  process.platform === 'linux' ? 'poi_32x32.png' : 'poi.ico',
)

electronRemote.initialize()

require('./lib/proxy')
setAllowedPath(ROOT)

const config: typeof configType = require('./lib/config')
const shortcut: typeof shortcutType = require('./lib/shortcut')
require('./lib/updater')
require('./lib/tray')
require('./lib/screenshot')
require('./lib/native-theme-helper')

// Register the poi-cache:// scheme before app `ready` (required for privileged schemes).
const {
  registerKcsResourceScheme,
  registerKcsResourceProtocol,
}: typeof kcsResourceType = require('./lib/kcs-resource')
registerKcsResourceScheme()

// macOS drag area fix
if (process.platform === 'darwin') {
  const electronDragClick = require('electron-drag-click')
  electronDragClick()
}

// Disable HA
if (config.get('poi.misc.disablehwaccel', false)) {
  app.commandLine.appendSwitch('disable-software-rasterizer')
  app.disableHardwareAcceleration()
}

// check safe mode config
if (config.get('poi.misc.safemode', false)) {
  warn('Entering SAFE MODE according to config.')
  global.isSafeMode = true
  config.set('poi.misc.safemode')
}

// Add shortcut to start menu when os is windows
app.setAppUserModelId('org.poooi.poi')
if (process.platform === 'win32' && config.get('poi.misc.shortcut', true)) {
  const shortcutPath =
    app.getPath('appData') + '\\Microsoft\\Windows\\Start Menu\\Programs\\poi.lnk'
  const targetPath = app.getPath('exe')
  const argPath = app.getAppPath()
  const cwdPath = process.cwd().startsWith(app.getPath('appData'))
    ? ROOT.endsWith('.asar')
      ? path.dirname(targetPath)
      : ROOT
    : process.cwd()
  const option: Electron.ShortcutDetails = {
    target: targetPath,
    args: argPath,
    cwd: cwdPath,
    appUserModelId: 'org.poooi.poi',
    description: 'poi the KanColle Browser Tool',
  }
  if (!ROOT.endsWith('.asar')) {
    Object.assign(option, {
      icon: path.join(ROOT, 'assets', 'icons', 'poi.ico'),
      iconIndex: 0,
    })
  }
  shell.writeShortcutLink(shortcutPath, option)
  const safeModeShortcutPath =
    app.getPath('appData') + '\\Microsoft\\Windows\\Start Menu\\Programs\\poi (safe mode).lnk'
  const safeModeOption = {
    ...option,
    description: 'poi the KanColle Browser Tool (safe mode)',
    args: `${argPath} --safe`,
    appUserModelId: 'org.poooi.poi.safe',
  }
  shell.writeShortcutLink(safeModeShortcutPath, safeModeOption)
}

if (dbg.isEnabled()) {
  global.SERVER_HOSTNAME = '127.0.0.1:17027'
} else {
  global.SERVER_HOSTNAME = 'api.poi.moe'
  process.env.NODE_ENV = 'production'
  if (config.get('poi.misc.exceptionReporting')) {
    const { init }: typeof sentryType = require('./lib/sentry')
    init({
      build: global.LATEST_COMMIT,
      paths: [ROOT, APPDATA_PATH],
    })
  }
}

let mainWindow: BrowserWindow | null = null

// enable audio autoplay
// https://github.com/electron/electron/issues/13525#issuecomment-410923391
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

// Polyfill for webview iframe isolation
app.commandLine.appendSwitch('disable-site-isolation-trials')

app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')

// Enable experimental require() features, which is required by some dependencies
app.commandLine.appendSwitch('experimental-require-module')
;(() => {
  /*
    Configure extra command flags.

    If APPDATA_PATH/hack/argv.json can be loaded successfully,
    add extra command line flags as specified by it:

    the loaded JSON object consists of two attributes:

    - "mode": only allowed value is "append"

    - "flags": must be an Array. elements are either:

      + plain string, in which case `appendSwitch(_)` is called
      + an Array consists of two strings, in which case `appendSwitch(_, _)` is called

    this could be useful to fine-tune some GPU settings, example content:

    {
      "mode": "append",
      "flags": [
        "ignore-gpu-blocklist",
        ["use-gl", "desktop"],
        ["gpu-testing-vendor-id", "0x1234"],
        ["gpu-testing-device-id", "0x5678"]
      ]
    }

    Note that this is intentionally not part of poi.config,
    as otherwise main program might not able to recover on its own
    should any of the command flags misconfigured.

   */
  const argvPath = path.join(APPDATA_PATH, 'hack', 'argv.json')
  try {
    const cfg = fs.readJsonSync(argvPath)
    if (cfg.mode !== 'append') {
      throw new Error('Only "append" mode is supported')
    }
    if (!Array.isArray(cfg.flags)) {
      throw new Error('No flags specified')
    }
    cfg.flags.forEach((flag: unknown) => {
      if (typeof flag === 'string') {
        app.commandLine.appendSwitch(flag)
      } else if (
        Array.isArray(flag) &&
        flag.length === 2 &&
        flag.every((x) => typeof x === 'string')
      ) {
        const [k, v] = flag
        app.commandLine.appendSwitch(k, v)
      } else {
        warn('Ignoring unrecognized flag: ', flag)
      }
    })
    console.info(`Config ${argvPath} loaded successfully.`)
  } catch (e) {
    if (!(e instanceof Error && 'code' in e && e.code === 'ENOENT')) {
      error(`Error while attempting to load ${argvPath}`, e)
    }
  }
})()

// Cache size
const cacheSize = Math.trunc(config.get('poi.misc.cache.size'))
if (Number.isInteger(cacheSize)) {
  app.commandLine.appendSwitch('disk-cache-size', `${1048576 * cacheSize}`)
}

app.on('window-all-closed', () => {
  shortcut.unregister()
  app.quit()
})

// Single instance
const getLock = app.requestSingleInstanceLock()

if (!getLock) {
  error('Another instance is running, exiting')
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()
    }
  })
}

app.on('ready', () => {
  require('electron-react-titlebar/main').initialize()
  registerKcsResourceProtocol()
  const { screen }: typeof electronType = require('electron')
  shortcut.register()
  const { workArea } = screen.getPrimaryDisplay()
  let { x, y, width, height } = config.get('poi.window', {
    ...workArea,
    isMaximized: false,
    isFullScreen: false,
  })
  const validate = (n: number | undefined, min: number, range: number) =>
    n != null && n >= min && n < min + range
  const withinDisplay = (d: Electron.Display) => {
    const wa = d.workArea
    return validate(x, wa.x, wa.width) && validate(y, wa.y, wa.height)
  }
  if (!screen.getAllDisplays().some(withinDisplay)) {
    x = workArea.x
    y = workArea.y
  }
  if (width == null) {
    width = workArea.width
  }
  if (height == null) {
    height = workArea.height
  }
  const hideTitlebar = config.get(
    'poi.appearance.customtitlebar',
    process.platform === 'win32' || process.platform === 'linux',
  )
  const win = new BrowserWindow({
    x: x,
    y: y,
    width: width,
    height: height,
    title: 'poi',
    icon: poiIconPath,
    resizable: config.get('poi.content.resizable', true),
    alwaysOnTop: config.get('poi.content.alwaysOnTop', false),
    // FIXME: titleBarStyle and transparent: https://github.com/electron/electron/issues/14129
    titleBarStyle:
      process.platform === 'darwin' ? 'hiddenInset' : hideTitlebar ? 'hidden' : undefined,
    transparent: process.platform === 'darwin',
    frame: !hideTitlebar,
    enableLargerThanScreen: true,
    maximizable: config.get('poi.content.resizable', true),
    fullscreenable: config.get('poi.content.resizable', true),
    webPreferences: {
      plugins: true,
      webviewTag: true,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      nodeIntegrationInSubFrames: true,
      zoomFactor: config.get('poi.appearance.zoom', 1),
      contextIsolation: false,
      spellcheck: false,
      backgroundThrottling: false,
    },
    backgroundColor: '#00000000',
    backgroundMaterial: config.get('poi.appearance.vibrant', 0) ? 'acrylic' : 'none',
    vibrancy: 'under-window',
    roundedCorners: true,
    show: false,
  })
  global.mainWindow = mainWindow = win

  win.once('ready-to-show', () => {
    win.show()
  })

  electronRemote.enable(win.webContents)
  win.webContents.addListener('did-attach-webview', (e, webContent) => {
    electronRemote.enable(webContent)
  })

  // Default menu
  if (process.platform === 'darwin') {
    const { renderMainTouchbar }: typeof touchbarType = require('./lib/touchbar')
    renderMainTouchbar()
    if (/electron$/i.test(process.argv[0])) {
      const icon = nativeImage.createFromPath(`${ROOT}/assets/icons/poi.png`)
      app.dock?.setIcon(icon)
    }
  } else {
    win.setMenu(null)
  }
  win.loadURL(`file://${__dirname}/index.html${dbg.isEnabled() ? '?react_perf' : ''}`)
  if (config.get('poi.window.isMaximized', false)) {
    win.maximize()
  }
  if (config.get('poi.window.isFullScreen', false)) {
    win.setFullScreen(true)
  }
  if (dbg.isEnabled()) {
    win.webContents.openDevTools({
      mode: 'detach',
    })
  }
  // Never wants navigate
  win.webContents.on('will-navigate', (e) => {
    e.preventDefault()
  })
  win.on('closed', () => {
    // Close all sub window
    const { closeWindows }: typeof windowManagerType = require('./lib/window')
    closeWindows()
    mainWindow = null
  })

  // display config
  const handleScreenStatusChange = () => {
    if (!win.isDestroyed()) {
      win.webContents.send('screen-status-changed', screen.getAllDisplays())
    }
  }
  ipcMain.on('displays::get-all', (e) => {
    e.returnValue = screen.getAllDisplays()
  })
  ipcMain.on('displays::remove-all-listeners', () => {
    screen.removeListener('display-added', handleScreenStatusChange)
    screen.removeListener('display-removed', handleScreenStatusChange)
    screen.removeListener('display-metrics-changed', handleScreenStatusChange)
  })
  screen.addListener('display-added', handleScreenStatusChange)
  screen.addListener('display-removed', handleScreenStatusChange)
  screen.addListener('display-metrics-changed', handleScreenStatusChange)

  // devtool
  if (config.get('poi.devtool.enable', false)) {
    require('./lib/devtool')
  }

  // DNS over HTTPS
  app.configureHostResolver({
    enableBuiltInResolver: true,
  })
})
// http basic auth
app.on('login', (event, webContents, request, authInfo, callback) => {
  event.preventDefault()
  mainWindow?.webContents.send('http-basic-auth', 'login')
  ipcMain.once('basic-auth-info', (event, usr, pwd) => {
    callback(usr, pwd)
  })
})

ipcMain.on('refresh-shortcut', () => {
  shortcut.unregister()
  shortcut.register()
})

let caCert: X509Certificate | undefined
let caCertError = false

const ensureCACert = () => {
  if (caCertError || caCert) {
    return
  }
  const customCertificateAuthority = config.get('poi.network.customCertificateAuthority', '')
  if (customCertificateAuthority) {
    try {
      const ca = fs.readFileSync(customCertificateAuthority, 'utf8')
      caCert = new X509Certificate(ca)
    } catch (e) {
      error('CA error', e)
      caCertError = true
    }
  }
}

const verifyCACert = memoize((data: string) => {
  ensureCACert()
  if (!caCert) {
    return false
  }
  const cert = new X509Certificate(data)
  const caPublicKey = caCert.publicKey
  return cert.verify(caPublicKey)
})

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  const trusted = config.get('poi.misc.trustedCerts', [])
  const isSignedByCA = verifyCACert(certificate.data)

  if (isSignedByCA) {
    event.preventDefault()
    callback(true)
  } else {
    const hash = createHash('sha256').update(certificate.data).digest('base64')
    if (trusted.includes(hash)) {
      event.preventDefault()
      callback(true)
    }
  }
})

// Uncaught error
process.on('uncaughtException', (e) => {
  error(e.stack)
})
