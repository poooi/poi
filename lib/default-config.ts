import type { Layouts } from 'react-grid-layout'

import type { PluginID } from './utils'

interface LimitFps {
  enabled: boolean
  value: number
}

interface Screenshot {
  format: string
  usecanvas: boolean
  path?: string
}

interface Cache {
  path: string
  size: number
}

interface PoiMisc {
  disablehwaccel: boolean
  limitFps: LimitFps
  safemode: boolean
  shortcut: boolean
  disablenetworkalert: boolean
  dmmcookie: boolean
  bypassgooglerestriction: boolean
  homepage: string
  networklog: boolean
  analytics: boolean
  exceptionReporting: boolean
  async: boolean
  screenshot: Screenshot
  cache: Cache
  trustedCerts: string[]
  pinminimap: boolean
  language?: string
}

interface PoiContent {
  resizable: boolean
  alwaysOnTop: boolean
  muted: boolean
}

interface PoiAppearance {
  avatar: boolean
  avatarType: string
  zoom: number
  theme: string
  colorblindFilter: string
  svgicon: boolean
  textspacingcjk: boolean
  vibrant: number
  customtitlebar: boolean
  background?: string
  enableOverviewFleetDetail?: boolean
}

interface PoiWindow {
  x?: number
  y?: number
  width?: number
  height?: number
  isMaximized: boolean
  isFullScreen: boolean
}

interface PoiShortcut {
  bosskey:
    | string
    | {
        macos: string
      }
}

interface PoiUpdate {
  beta: boolean
  enable: boolean
}

interface WebviewRatio {
  vertical: number
  horizontal: number
}

interface PoiWebview {
  useFixedResolution?: boolean
  windowUseFixedResolution?: boolean
  windowWidth?: number
  width?: number
  ratio?: WebviewRatio
}

interface PoiLayout {
  overlay: boolean
  mode: string
  isolate: boolean
  reverse: boolean
  editable: boolean
}

interface PoiConfirm {
  quit: boolean
}

interface MainPanelDimension {
  px: number
  percent: number
}

interface PoiTabarea {
  vertical: boolean
  double: boolean
  grid: boolean
  mainpanelwidth: MainPanelDimension
  mainpanelheight: MainPanelDimension
}

interface NotifyItem {
  enabled: boolean
}

interface NotifyItemWithValue {
  value: number
  enabled: boolean
}

interface NotifyDelay {
  dev: boolean
  improve: boolean
}

interface NotifyBattleEnd {
  enabled: boolean
  onlyBackground: boolean
  onlyMuted: boolean
}

interface PoiNotify {
  morale: NotifyItemWithValue
  expedition: NotifyItemWithValue
  volume: number
  delay: NotifyDelay
  enabled: boolean
  construction: NotifyItem
  repair: NotifyItem
  battleEnd: NotifyBattleEnd
  others: NotifyItem
}

interface MapStartCheckSlot {
  enable: boolean
  minFreeSlots: number
}

interface PoiMapStartCheck {
  ship: MapStartCheckSlot
  item: MapStartCheckSlot
}

interface PoiUnusedEquipmentSlotCheck {
  enable: boolean
  ignoreUnlocked: boolean
}

interface PoiMainPanel {
  layout: Layouts
}

interface PluginBooleanMap {
  [pluginId: PluginID]: boolean
}

interface PoiPluginConfig {
  windowmode?: PluginBooleanMap
  background?: PluginBooleanMap
  favorite?: PluginBooleanMap
}

interface PoiNetwork {
  customCertificateAuthority?: string
}

interface PoiAutoSwitchPlugins {
  enabled: boolean
  main: boolean
  [pluginId: string]: boolean
}

interface Poi {
  misc: PoiMisc
  content: PoiContent
  appearance: PoiAppearance
  window: PoiWindow
  shortcut: PoiShortcut
  update: PoiUpdate
  webview: PoiWebview
  layout: PoiLayout
  confirm: PoiConfirm
  autoswitch: PoiAutoSwitchPlugins
  tabarea: PoiTabarea
  notify: PoiNotify
  eventSortieCheck: { enable: boolean }
  expeditionResupplyCheck: { enable: boolean }
  unusedEquipmentSlotCheck: PoiUnusedEquipmentSlotCheck
  mapStartCheck: PoiMapStartCheck
  transition: { enable: boolean }
  mainpanel: PoiMainPanel
  plugin: PoiPluginConfig
  network: PoiNetwork
}

interface Socks5Proxy {
  host: string
  port: number
}

interface HttpProxy {
  host: string
  port: number
  requirePassword: boolean
  username: string
  password: string
}

interface Proxy {
  socks5: Socks5Proxy
  http: HttpProxy
  use: string
  pacAddr?: string
}

interface PackageManager {
  enablePluginCheck: boolean
  enableBetaPluginCheck: boolean
  enableAutoUpdate: boolean
  mirrorName?: string
}

interface IndividualPluginConfig {
  enable?: boolean
  bounds?: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface PluginConfig {
  [pluginId: PluginID]: IndividualPluginConfig
}

export interface Config {
  poi: Poi
  proxy: Proxy
  packageManager: PackageManager
  plugin: PluginConfig
}

const defaultConfig: Config = {
  poi: {
    misc: {
      disablehwaccel: false,
      limitFps: {
        enabled: false,
        value: 60,
      },
      safemode: false,
      shortcut: true,
      disablenetworkalert: false,
      dmmcookie: false,
      bypassgooglerestriction: false,
      homepage: 'https://play.games.dmm.com/game/kancolle',
      networklog: true,
      analytics: true,
      exceptionReporting: true,
      async: true,
      screenshot: {
        format: 'png',
        usecanvas: false,
      },
      cache: {
        path: global.DEFAULT_CACHE_PATH,
        size: 640,
      },
      trustedCerts: [],
      pinminimap: false,
    },
    content: {
      resizable: true,
      alwaysOnTop: false,
      muted: false,
    },
    appearance: {
      avatar: true,
      avatarType: 'none',
      zoom: 1,
      theme: 'dark',
      colorblindFilter: 'null',
      svgicon: false,
      textspacingcjk: true,
      vibrant: 0,
      customtitlebar: process.platform === 'win32' || process.platform === 'linux',
    },
    window: {
      isMaximized: false,
      isFullScreen: false,
    },
    shortcut: {
      bosskey: '',
    },
    update: {
      beta: false,
      enable: true,
    },
    webview: {
      useFixedResolution: true,
      windowUseFixedResolution: true,
      windowWidth: 1200,
      width: 1200,
      ratio: {
        vertical: 50,
        horizontal: 60,
      },
    },
    layout: {
      overlay: false,
      mode: 'horizontal',
      isolate: false,
      reverse: false,
      editable: false,
    },
    confirm: {
      quit: false,
    },
    autoswitch: {
      enabled: true,
      main: true,
    },
    tabarea: {
      vertical: false,
      double: false,
      grid: true,
      mainpanelwidth: {
        px: 0,
        percent: 50,
      },
      mainpanelheight: {
        px: 0,
        percent: 50,
      },
    },
    notify: {
      morale: {
        value: 49,
        enabled: true,
      },
      expedition: {
        value: 60,
        enabled: true,
      },
      volume: 0.8,
      delay: {
        dev: false,
        improve: false,
      },
      enabled: true,
      construction: {
        enabled: true,
      },
      repair: {
        enabled: true,
      },
      battleEnd: {
        enabled: true,
        onlyBackground: true,
        onlyMuted: true,
      },
      others: {
        enabled: true,
      },
    },
    eventSortieCheck: {
      enable: true,
    },
    expeditionResupplyCheck: {
      enable: false,
    },
    unusedEquipmentSlotCheck: {
      enable: false,
      ignoreUnlocked: false,
    },
    mapStartCheck: {
      ship: {
        enable: false,
        minFreeSlots: 4,
      },
      item: {
        enable: false,
        minFreeSlots: 10,
      },
    },
    transition: {
      enable: true,
    },
    mainpanel: {
      layout: {
        sm: [
          {
            w: 10,
            h: 3,
            x: 0,
            y: 0,
            minW: 3,
            minH: 2,
            maxW: 10,
            maxH: 50,
            i: 'teitoku-panel',
          },
          {
            w: 5,
            h: 8,
            x: 0,
            y: 3,
            minW: 1,
            minH: 3,
            maxW: 10,
            maxH: 50,
            i: 'resource-panel',
          },
          {
            w: 5,
            h: 24,
            x: 0,
            y: 11,
            minW: 3,
            minH: 9,
            maxW: 10,
            maxH: 50,
            i: 'miniship',
          },
          {
            w: 5,
            h: 6,
            x: 5,
            y: 3,
            minW: 2,
            minH: 6,
            maxW: 10,
            maxH: 50,
            i: 'repair-panel',
          },
          {
            w: 5,
            h: 6,
            x: 5,
            y: 9,
            minW: 2,
            minH: 6,
            maxW: 10,
            maxH: 50,
            i: 'construction-panel',
          },
          {
            w: 5,
            h: 7,
            x: 5,
            y: 15,
            minW: 3,
            minH: 5,
            maxW: 10,
            maxH: 50,
            i: 'expedition-panel',
          },
          {
            w: 5,
            h: 13,
            x: 5,
            y: 23,
            minW: 3,
            minH: 5,
            maxW: 10,
            maxH: 50,
            i: 'task-panel',
          },
        ],
        lg: [
          {
            w: 12,
            h: 3,
            x: 0,
            y: 0,
            minW: 3,
            minH: 2,
            maxW: 20,
            maxH: 50,
            i: 'teitoku-panel',
          },
          {
            w: 6,
            h: 8,
            x: 0,
            y: 3,
            minW: 1,
            minH: 3,
            maxW: 20,
            maxH: 50,
            i: 'resource-panel',
          },
          {
            w: 8,
            h: 25,
            x: 12,
            y: 0,
            minW: 3,
            minH: 9,
            maxW: 20,
            maxH: 50,
            i: 'miniship',
          },
          {
            w: 6,
            h: 7,
            x: 6,
            y: 11,
            minW: 2,
            minH: 6,
            maxW: 10,
            maxH: 50,
            i: 'repair-panel',
          },
          {
            w: 6,
            h: 7,
            x: 6,
            y: 18,
            minW: 2,
            minH: 6,
            maxW: 10,
            maxH: 50,
            i: 'construction-panel',
          },
          {
            w: 6,
            h: 8,
            x: 6,
            y: 3,
            minW: 3,
            minH: 5,
            maxW: 20,
            maxH: 50,
            i: 'expedition-panel',
          },
          {
            w: 6,
            h: 14,
            x: 0,
            y: 11,
            minW: 3,
            minH: 5,
            maxW: 20,
            maxH: 50,
            i: 'task-panel',
          },
        ],
      },
    },
    plugin: {},
    network: {},
  },
  proxy: {
    socks5: {
      host: '127.0.0.1',
      port: 1080,
    },
    http: {
      host: '127.0.0.1',
      port: 8118,
      requirePassword: false,
      username: '',
      password: '',
    },
    use: 'none',
  },
  packageManager: {
    enablePluginCheck: true,
    enableBetaPluginCheck: false,
    enableAutoUpdate: true,
  },
  plugin: {},
}

export default defaultConfig
