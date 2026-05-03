import type { MenuItemConstructorOptions, Tray } from 'electron/main'
import type { Config } from 'lib/default-config'

import * as remote from '@electron/remote'
import themes from 'assets/data/theme.json'
import { shell } from 'electron'
import { TitleBar } from 'electron-react-titlebar/renderer'
import { get, capitalize } from 'lodash'
import path from 'path'
import React, { PureComponent } from 'react'
import i18next from 'views/env-parts/i18next'
import { getStore } from 'views/redux/create-store'
import 'electron-react-titlebar/assets/style.css'
import { reduxSet } from 'views/utils/tools'

declare global {
  interface Window {
    openSettings?: () => void
  }
  interface Screen {
    availTop: number
    availLeft: number
  }
}

const Menu = remote.Menu
const { openExternal } = shell

const resetViews = () => {
  const { availWidth, availHeight, availTop, availLeft } = window.screen
  const webViewConfig: Config['poi']['webview'] = {
    width: 1200,
  }
  if (availHeight < 900) {
    webViewConfig.width = 800
  }
  config.set('poi.layout.mode', 'horizontal')
  config.set('poi.webview', webViewConfig)
  config.set('poi.appearance.zoom', 1)
  window.setImmediate(() => {
    remote.getCurrentWindow().setPosition(availLeft, availTop)
    remote.getCurrentWindow().setContentSize(availWidth, availHeight)
  })
}

type MenuTemplate = MenuItemConstructorOptions[]

const getWebviewRef = () => getStore('layout.webview.ref')

let template: MenuTemplate = []

if (process.platform !== 'darwin') {
  template = [
    {
      label: 'poi',
      submenu: [
        {
          label: i18next.t('menu:Preferences'),
          click: () => {
            window.openSettings?.()
          },
        },
        { type: 'separator' },
        {
          label: i18next.t('menu:Hide poi'),
          click: () => {
            remote.getGlobal('mainWindow').hide()
          },
        },
        {
          label: i18next.t('menu:Show poi'),
          click: () => {
            remote.getGlobal('mainWindow').show()
          },
        },
        { type: 'separator' },
        {
          label: i18next.t('menu:Reset Views'),
          type: 'normal',
          click: resetViews,
        },
        {
          label: i18next.t('menu:Resizable'),
          type: 'checkbox',
          checked: config.get('poi.content.resizable', true),
          click: (item) => {
            const mainWindow = remote.getGlobal('mainWindow')
            mainWindow.setResizable(item.checked ?? false)
            mainWindow.setMaximizable(item.checked ?? false)
            mainWindow.setFullScreenable(item.checked ?? false)
            config.set('poi.content.resizable', item.checked ?? false)
          },
        },
        {
          label: i18next.t('menu:Always on top'),
          type: 'checkbox',
          checked: config.get('poi.content.alwaysOnTop', false),
          click: (item) => {
            remote.getGlobal('mainWindow').setAlwaysOnTop(item.checked ?? false)
            config.set('poi.content.alwaysOnTop', item.checked ?? false)
          },
        },
        { type: 'separator' },
        {
          label: i18next.t('menu:Quit poi'),
          click: () => {
            remote.getCurrentWindow().focus()
            window.close()
          },
        },
      ],
    },
    {
      label: i18next.t('menu:View'),
      submenu: [
        {
          label: i18next.t('menu:Reload'),
          accelerator: 'Ctrl+R',
          click: () => {
            getWebviewRef()?.reload()
          },
        },
        {
          label: i18next.t('menu:Stop'),
          accelerator: 'Ctrl+.',
          click: () => {
            getWebviewRef()?.stop()
          },
        },
        {
          label: i18next.t('menu:Developer Tools'),
          accelerator: 'Ctrl+Shift+I',
          click: (_item, focusedWindow) => {
            // @ts-expect-error type is wrong
            focusedWindow?.openDevTools({ mode: 'detach' })
          },
        },
        {
          label: i18next.t('menu:Developer Tools of WebView'),
          click: () => {
            getWebviewRef()?.getWebContents()?.openDevTools({ mode: 'detach' })
          },
        },
      ],
    },
    {
      label: i18next.t('menu:Themes'),
      submenu: [],
    },
    {
      label: i18next.t('menu:Help'),
      role: 'help',
      submenu: [
        {
          label: i18next.t('menu:Wiki'),
          click: () => {
            openExternal('https://github.com/poooi/poi/wiki')
          },
        },
        {
          label: i18next.t('menu:poi Statistics'),
          click: () => {
            openExternal('http://db.kcwiki.org/')
          },
        },
        { type: 'separator' },
        {
          label: i18next.t('menu:Report Issue'),
          click: () => {
            openExternal('https://github.com/poooi/poi/issues')
          },
        },
        {
          label: i18next.t('menu:Search Issues'),
          click: () => {
            openExternal('https://github.com/issues?q=+is%3Aissue+user%3Apoooi')
          },
        },
      ],
    },
  ]
} else {
  template = [
    {
      label: 'poi',
      submenu: [
        {
          label: i18next.t('menu:About poi'),
          role: 'about',
        },
        { type: 'separator' },
        {
          label: i18next.t('menu:Preferences'),
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            window.openSettings?.()
          },
        },
        { type: 'separator' },
        {
          label: i18next.t('menu:Services'),
          role: 'services',
          submenu: [],
        },
        { type: 'separator' },
        {
          label: i18next.t('menu:Hide poi'),
          accelerator: 'CmdOrCtrl+H',
          role: 'hide',
        },
        {
          label: i18next.t('menu:Hide others'),
          accelerator: 'CmdOrCtrl+Shift+H',
          role: 'hideOthers',
        },
        {
          label: i18next.t('menu:Show All'),
          role: 'unhide',
        },
        { type: 'separator' },
        {
          label: i18next.t('menu:Reset Views'),
          type: 'normal',
          click: resetViews,
        },
        {
          label: i18next.t('menu:Resizable'),
          type: 'checkbox',
          checked: config.get('poi.content.resizable', true),
          click: (item) => {
            if (
              config.get('poi.webview.useFixedResolution', true) &&
              config.get('poi.layout.overlay', false)
            ) {
              return
            }
            const mainWindow = remote.getGlobal('mainWindow')
            mainWindow.setResizable(item.checked ?? false)
            mainWindow.setMaximizable(item.checked ?? false)
            mainWindow.setFullScreenable(item.checked ?? false)
            config.set('poi.content.resizable', item.checked ?? false)
          },
        },
        {
          label: i18next.t('menu:Always on top'),
          type: 'checkbox',
          checked: config.get('poi.content.alwaysOnTop', false),
          click: (item) => {
            remote.getGlobal('mainWindow').setAlwaysOnTop(item.checked ?? false)
            config.set('poi.content.alwaysOnTop', item.checked ?? false)
          },
        },
        { type: 'separator' },
        {
          label: i18next.t('menu:Confirm before exit'),
          type: 'checkbox',
          checked: config.get('poi.confirm.quit', false),
          click: (item) => {
            config.set('poi.confirm.quit', item.checked ?? false)
          },
        },
        { type: 'separator' },
        {
          label: i18next.t('menu:Quit poi'),
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            remote.getCurrentWindow().focus()
            window.close()
          },
        },
      ],
    },
    {
      label: i18next.t('menu:Edit'),
      submenu: [
        { label: i18next.t('menu:Undo'), accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: i18next.t('menu:Redo'), accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: i18next.t('menu:Cut'), accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: i18next.t('menu:Copy'), accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: i18next.t('menu:Paste'), accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: i18next.t('menu:Select All'), accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
      ],
    },
    {
      label: i18next.t('menu:View'),
      submenu: [
        {
          label: i18next.t('menu:Reload'),
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            getWebviewRef()?.reload()
          },
        },
        {
          label: i18next.t('menu:Stop'),
          accelerator: 'CmdOrCtrl+.',
          click: () => {
            getWebviewRef()?.stop()
          },
        },
        { type: 'separator' },
        {
          label: i18next.t('menu:Developer Tools'),
          accelerator: 'Alt+CmdOrCtrl+I',
          click: (_item, focusedWindow) => {
            // @ts-expect-error type is wrong
            focusedWindow?.openDevTools({ mode: 'detach' })
          },
        },
        {
          label: i18next.t('menu:Developer Tools of WebView'),
          click: () => {
            getWebviewRef()?.getWebContents()?.openDevTools({ mode: 'detach' })
          },
        },
      ],
    },
    {
      label: i18next.t('menu:Themes'),
      submenu: [],
    },
    {
      label: i18next.t('menu:Window'),
      role: 'window',
      submenu: [
        { label: i18next.t('menu:Minimize'), accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: i18next.t('menu:Close'), accelerator: 'CmdOrCtrl+W', role: 'close' },
        { type: 'separator' },
        { label: i18next.t('menu:Bring All to Front'), role: 'front' },
      ],
    },
    {
      label: i18next.t('menu:Help'),
      role: 'help',
      submenu: [
        {
          label: i18next.t('menu:Wiki'),
          click: () => {
            openExternal('https://github.com/poooi/poi/wiki')
          },
        },
        {
          label: i18next.t('menu:poi Statistics'),
          click: () => {
            openExternal('http://db.kcwiki.org/')
          },
        },
        { type: 'separator' },
        {
          label: i18next.t('menu:Report Issue'),
          click: () => {
            openExternal('https://github.com/poooi/poi/issues')
          },
        },
        {
          label: i18next.t('menu:Search Issues'),
          click: () => {
            openExternal('https://github.com/issues?q=+is%3Aissue+user%3Apoooi')
          },
        },
      ],
    },
  ]
}

const themepos = process.platform === 'darwin' ? 3 : 2
for (let i = themes.length - 1; i >= 0; i--) {
  const th = themes[i]
  if (Array.isArray(template[themepos].submenu)) {
    template[themepos].submenu.unshift({
      label: th === '__default__' ? 'Default' : capitalize(th),
      type: 'radio',
      checked: config.get('poi.appearance.theme', 'dark') === th,
      click: () => {
        if (th !== config.get('poi.appearance.theme', 'dark')) {
          window.applyTheme(th)
        }
      },
    })
  }
}

export const appMenu = Menu.buildFromTemplate(template)
if (process.platform === 'darwin') {
  Menu.setApplicationMenu(appMenu)
} else {
  const win = remote.getCurrentWindow()
  win.setMenu(appMenu)
  win.setAutoHideMenuBar(true)
  win.setMenuBarVisibility(false)
  const appTray: Tray = remote.getGlobal('appTray')
  if (appTray) {
    appTray.setContextMenu(appMenu)
  }
}

const themeMenuList = appMenu?.items[themepos].submenu?.items

config.on('config.set', (configPath, value) => {
  if (configPath === 'poi.appearance.theme' && typeof value === 'string') {
    const idx = themes.indexOf(value)
    if (themeMenuList?.[idx]) {
      themeMenuList[idx].checked = true
    }
  }
})

interface TitleBarWrapperState {
  menu: MenuTemplate
}

export class TitleBarWrapper extends PureComponent<Record<string, never>, TitleBarWrapperState> {
  state: TitleBarWrapperState = {
    menu: template,
  }

  handleThemeChange = (configPath: string, value: unknown) => {
    if (configPath === 'poi.appearance.theme') {
      let newTemplate = [...this.state.menu]
      const submenu = newTemplate[themepos]?.submenu
      if (!submenu || !Array.isArray(submenu)) {
        return
      }
      for (let i = 0; i < submenu.length; i++) {
        if (get(newTemplate, `${themepos}.submenu.${i}.type`) === 'radio') {
          newTemplate = reduxSet(
            newTemplate,
            // @ts-expect-error type is wrong
            [themepos, 'submenu', i, 'checked'] as const,
            get(newTemplate, `${themepos}.submenu.${i}.label`).toLowerCase() === value,
          )
        }
      }
      this.setState({ menu: newTemplate })
    }
  }

  componentDidMount = () => {
    config.addListener('config.set', this.handleThemeChange)
  }

  componentWillUnmount = () => {
    config.removeListener('config.set', this.handleThemeChange)
  }

  render() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return React.createElement(TitleBar as React.ComponentType<any>, {
      menu: this.state.menu,
      icon: path.join(window.ROOT, 'assets', 'icons', 'poi_32x32.png'),
    })
  }
}
