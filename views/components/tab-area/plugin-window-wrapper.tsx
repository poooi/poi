import type { ConfigPath, ConfigValue } from 'lib/config'
import type { Plugin } from 'views/services/plugin-manager'

import * as remote from '@electron/remote'
// screen and BrowserWindow are set via Object.defineProperty in @electron/remote and are not
// in the ESM namespace; use the CJS require to get the live getters.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const remoteBuiltins: typeof remote = require('@electron/remote')
import { TitleBar } from 'electron-react-titlebar/renderer'
import { join } from 'path'
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import ReactDOM from 'react-dom'
import { StyleSheetManager, styled } from 'styled-components'
import { appMenu } from 'views/components/etc/menu'
import { WindowEnv } from 'views/components/etc/window-env'
import { ROOT, ipc } from 'views/env'
import { config } from 'views/env-parts/config'
import { loadStyle } from 'views/env-parts/theme'
import { fileUrl } from 'views/utils/tools'

import { PluginWrap } from './plugin-wrapper'

interface WindowRect {
  x?: number
  y?: number
  width: number
  height: number
}

const getPluginWindowRect = (plugin: Plugin): WindowRect => {
  const defaultRect: WindowRect = plugin.windowMode
    ? { width: 800, height: 700 }
    : { width: 600, height: 500 }
  const bounds = config.get(`plugin.${plugin.id}.bounds`) ?? defaultRect
  let { x, y, width, height } = bounds
  if (x == null || y == null) {
    return defaultRect
  }
  const validate = (n: number | undefined, min: number, range: number): boolean =>
    n != null && n >= min && n < min + range
  const withinDisplay = (d: Electron.Display): boolean => {
    const wa = d.workArea
    return validate(x, wa.x, wa.width) && validate(y, wa.y, wa.height)
  }
  if (!remoteBuiltins.screen.getAllDisplays().some(withinDisplay)) {
    const { workArea } = remoteBuiltins.screen.getPrimaryDisplay()
    x = workArea.x
    y = workArea.y
  }
  width ??= defaultRect.width
  height ??= defaultRect.height
  return { x, y, width, height }
}

const PoiAppTabpane = styled.div`
  flex: 1;
  width: 100%;
  overflow: hidden;
`

const stylesheetTagsWithID = [
  'bootstrap',
  'normalize',
  'blueprint',
  'blueprint-icon',
  'fontawesome',
]
  .map((id) => `<link rel="stylesheet" type="text/css" id="${id}-css">`)
  .join('')

const stylesheetTagsWithHref = [
  join(ROOT, 'assets/css/app.css'),
  join(ROOT, 'assets/css/global.css'),
  require.resolve('electron-react-titlebar/assets/style.css'),
  require.resolve('react-resizable/css/styles.css'),
  require.resolve('react-grid-layout/css/styles.css'),
]
  .map((href) => `<link rel="stylesheet" type="text/css" href="${fileUrl(href)}">`)
  .join('')

interface Props {
  plugin: Plugin
  closeWindowPortal: () => void
}

export interface PluginWindowWrapHandle {
  focusWindow: () => void
}

export const PluginWindowWrap = forwardRef<PluginWindowWrapHandle, Props>(
  ({ plugin, closeWindowPortal }, ref) => {
    const containerElRef = useRef<HTMLDivElement | null>(null)
    if (!containerElRef.current) {
      const el = document.createElement('div')
      el.id = 'plugin-mountpoint'
      Object.assign(el.style, { display: 'flex', flexDirection: 'column', height: '100vh' })
      containerElRef.current = el
    }
    const containerEl = containerElRef.current

    const externalWindowRef = useRef<Window | null>(null)
    const currentWindowRef = useRef<Electron.BrowserWindow | undefined>()
    const pluginContainer = useRef<HTMLDivElement>(null)

    const [loaded, setLoaded] = useState(false)
    const [windowId, setWindowId] = useState<number | undefined>()

    const checkBrowserWindowExistence = useCallback((): boolean => {
      if (
        !windowId ||
        !remoteBuiltins.BrowserWindow.fromId(windowId) ||
        !currentWindowRef.current
      ) {
        console.warn('Plugin window not exists. Removing window...')
        try {
          closeWindowPortal()
        } catch (e) {
          console.error(e)
        }
        return false
      }
      return true
    }, [windowId, closeWindowPortal])

    useImperativeHandle(
      ref,
      () => ({
        focusWindow: () => {
          if (checkBrowserWindowExistence()) {
            if (currentWindowRef.current!.isMinimized()) {
              currentWindowRef.current!.restore()
            }
            currentWindowRef.current?.focus()
          } else {
            setImmediate(() => {
              ipc.access('MainWindow')?.ipcFocusPlugin?.(plugin.id)
            })
          }
        },
      }),
      [checkBrowserWindowExistence, plugin.id],
    )

    useEffect(() => {
      const windowOptions = getPluginWindowRect(plugin)
      const windowFeatures = Object.keys(windowOptions)
        .flatMap((key) => {
          switch (key) {
            case 'x':
              return [`left=${windowOptions.x}`]
            case 'y':
              return [`top=${windowOptions.y}`]
            case 'width':
              return [`width=${windowOptions.width}`]
            case 'height':
              return [`height=${windowOptions.height}`]
            default:
              return []
          }
        })
        .join(',')

      const handleZoom = <P extends ConfigPath>(configPath: P, value: ConfigValue<P>): void => {
        if (configPath === 'poi.appearance.zoom' && typeof value === 'number') {
          if (currentWindowRef.current) {
            currentWindowRef.current.webContents.zoomFactor = value
          }
        }
      }

      try {
        const URL = `${fileUrl(join(ROOT, 'index-plugin.html'))}?${plugin.id}`
        const externalWindow = open(
          URL,
          `plugin[${plugin.id}]`,
          windowFeatures + ',nodeIntegration=no',
        )
        externalWindowRef.current = externalWindow

        externalWindow?.addEventListener('DOMContentLoaded', () => {
          if (!externalWindowRef.current) return
          const currentWindow = remoteBuiltins.BrowserWindow.getAllWindows().find((a) =>
            a.webContents.getURL().endsWith(plugin.id),
          )
          currentWindowRef.current = currentWindow
          externalWindowRef.current.document.head.innerHTML = `<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="script-src https://www.google-analytics.com 'self' file://* 'unsafe-inline'">
${stylesheetTagsWithID}${stylesheetTagsWithHref}`
          if (process.platform === 'darwin') {
            const div = document.createElement('div')
            div.style.position = 'absolute'
            div.style.top = '0'
            div.style.height = '23px'
            div.style.width = '100%'
            div.style.setProperty('-webkit-app-region', 'drag')
            div.style.setProperty('pointer-events', 'none')
            externalWindowRef.current.document.body.appendChild(div)
          } else if (currentWindow) {
            currentWindow.setMenu(appMenu)
            currentWindow.setAutoHideMenuBar(true)
            currentWindow.setMenuBarVisibility(false)
          }
          externalWindowRef.current.document.body.appendChild(containerEl)
          externalWindowRef.current.document.title = plugin.name
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any
          ;(externalWindowRef.current as any).isWindowMode = true
          loadStyle(externalWindowRef.current.document, currentWindow, false)
          remote.require('./lib/webcontent-utils').stopFileNavigate(currentWindow?.webContents.id)
          externalWindowRef.current.addEventListener('beforeunload', () => {
            setLoaded(false)
            config.set(`plugin.${plugin.id}.bounds`, currentWindowRef.current?.getBounds())
            try {
              closeWindowPortal()
            } catch (e) {
              console.error(e)
            }
          })
          const initialZoom = config.get('poi.appearance.zoom', 1)
          if (currentWindow) {
            currentWindow.webContents.zoomFactor = initialZoom
          }
          setLoaded(true)
          setWindowId(currentWindow?.id)
        })

        config.addListener('config.set', handleZoom)
      } catch (e) {
        console.error(e)
        closeWindowPortal()
      }

      return () => {
        config.removeListener('config.set', handleZoom)
        try {
          externalWindowRef.current?.close()
        } catch (e) {
          console.error(e)
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!loaded || !externalWindowRef.current || !checkBrowserWindowExistence()) return null

    const mountPoint = externalWindowRef.current.document.querySelector('#plugin-mountpoint')
    if (!mountPoint) return null

    const showCustomTitleBar = config.get(
      'poi.appearance.customtitlebar',
      process.platform === 'win32' || process.platform === 'linux',
    )

    return ReactDOM.createPortal(
      <>
        {showCustomTitleBar && currentWindowRef.current && (
          <TitleBar
            icon={join(ROOT, 'assets', 'icons', 'poi_32x32.png')}
            browserWindowId={currentWindowRef.current.id}
          />
        )}
        <WindowEnv.Provider
          value={{
            window: externalWindowRef.current,
            mountPoint: containerEl,
          }}
        >
          <StyleSheetManager target={externalWindowRef.current.document.head}>
            <PoiAppTabpane className="poi-app-tabpane" ref={pluginContainer}>
              <PluginWrap key={plugin.id} plugin={plugin} />
            </PoiAppTabpane>
          </StyleSheetManager>
        </WindowEnv.Provider>
      </>,
      mountPoint,
    )
  },
)

PluginWindowWrap.displayName = 'PluginWindowWrap'
