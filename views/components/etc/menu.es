/* global config, getStore */
import React, { PureComponent } from 'react'
import { shell } from 'electron'
import * as remote from '@electron/remote'
import { TitleBar } from 'electron-react-titlebar/renderer'
import { reduxSet } from 'views/utils/tools'
import { get, capitalize } from 'lodash'
import path from 'path'
import i18next from 'views/env-parts/i18next'
import themes from 'assets/data/theme.json'

const { Menu } = remote.require('electron')
const { openExternal } = shell

const resetViews = () => {
  const { availWidth, availHeight, availTop, availLeft } = window.screen
  const webViewConfig = {}
  if (availHeight < 900) {
    // setting bar will hide below 900 px
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

let template = []

if (process.platform !== 'darwin') {
  template = [
    {
      label: 'poi',
      submenu: [
        {
          label: i18next.t('menu:Preferences'),
          click: (item, focusedWindow) => {
            window.openSettings()
          },
        },
        { type: 'separator' },
        {
          label: i18next.t('menu:Hide poi'),
          click: (item, focusedWindow) => {
            remote.getGlobal('mainWindow').hide()
          },
        },
        {
          label: i18next.t('menu:Show poi'),
          click: (item, focusedWindow) => {
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
          click: (item, focusedWindow) => {
            const mainWindow = remote.getGlobal('mainWindow')
            mainWindow.setResizable(item.checked)
            mainWindow.setMaximizable(item.checked)
            mainWindow.setFullScreenable(item.checked)
            config.set('poi.content.resizable', item.checked)
          },
        },
        {
          label: i18next.t('menu:Always on top'),
          type: 'checkbox',
          checked: config.get('poi.content.alwaysOnTop', false),
          click: (item, focusedWindow) => {
            remote.getGlobal('mainWindow').setAlwaysOnTop(item.checked)
            config.set('poi.content.alwaysOnTop', item.checked)
          },
        },
        { type: 'separator' },
        {
          label: i18next.t('menu:Quit poi'),
          click: () => {
            // The terminate selector will ignore the 'poi.confirm.quit' setting
            // and try to close any (plugin) window it can close first.
            // So here we should only try to close the main window and let it handle all the rest.
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
          click: (item, focusedWindow) => {
            getStore('layout.webview.ref').reload()
          },
        },
        {
          label: i18next.t('menu:Stop'),
          accelerator: 'Ctrl+.',
          click: (item, focusedWindow) => {
            getStore('layout.webview.ref').stop()
          },
        },
        {
          label: i18next.t('menu:Developer Tools'),
          accelerator: 'Ctrl+Shift+I',
          click: (item, focusedWindow) => {
            focusedWindow.openDevTools({ mode: 'detach' })
          },
        },
        {
          label: i18next.t('menu:Developer Tools of WebView'),
          click: (item, focusedWindow) => {
            getStore('layout.webview.ref').openDevTools({ mode: 'detach' })
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
          click: (item, focusedWindow) => {
            window.openSettings()
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
          role: 'hideothers',
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
          click: (item, focusedWindow) => {
            if (
              config.get('poi.webview.useFixedResolution', true) &&
              config.get('poi.layout.overlay', false)
            ) {
              return
            }
            const mainWindow = remote.getGlobal('mainWindow')
            mainWindow.setResizable(item.checked)
            mainWindow.setMaximizable(item.checked)
            mainWindow.setFullScreenable(item.checked)
            config.set('poi.content.resizable', item.checked)
          },
        },
        {
          label: i18next.t('menu:Always on top'),
          type: 'checkbox',
          checked: config.get('poi.content.alwaysOnTop', false),
          click: (item, focusedWindow) => {
            remote.getGlobal('mainWindow').setAlwaysOnTop(item.checked)
            config.set('poi.content.alwaysOnTop', item.checked)
          },
        },
        { type: 'separator' },
        {
          label: i18next.t('menu:Confirm before exit'),
          type: 'checkbox',
          checked: config.get('poi.confirm.quit', false),
          click: (item, focusedWindow) => {
            config.set('poi.confirm.quit', item.checked)
          },
        },
        { type: 'separator' },
        {
          label: i18next.t('menu:Quit poi'),
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            // The terminate selector will ignore the 'poi.confirm.quit' setting
            // and try to close any (plugin) window it can close first.
            // So here we should only try to close the main window and let it handle all the rest.
            remote.getCurrentWindow().focus()
            window.close()
          },
        },
      ],
    },
    {
      label: i18next.t('menu:Edit'),
      submenu: [
        {
          label: i18next.t('menu:Undo'),
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo',
        },
        {
          label: i18next.t('menu:Redo'),
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo',
        },
        { type: 'separator' },
        {
          label: i18next.t('menu:Cut'),
          accelerator: 'CmdOrCtrl+X',
          role: 'cut',
        },
        {
          label: i18next.t('menu:Copy'),
          accelerator: 'CmdOrCtrl+C',
          role: 'copy',
        },
        {
          label: i18next.t('menu:Paste'),
          accelerator: 'CmdOrCtrl+V',
          role: 'paste',
        },
        {
          label: i18next.t('menu:Select All'),
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall',
        },
      ],
    },
    {
      label: i18next.t('menu:View'),
      submenu: [
        {
          label: i18next.t('menu:Reload'),
          accelerator: 'CmdOrCtrl+R',
          click: (item, focusedWindow) => {
            getStore('layout.webview.ref').reload()
          },
        },
        {
          label: i18next.t('menu:Stop'),
          accelerator: 'CmdOrCtrl+.',
          click: (item, focusedWindow) => {
            getStore('layout.webview.ref').stop()
          },
        },
        { type: 'separator' },
        {
          label: i18next.t('menu:Developer Tools'),
          accelerator: 'Alt+CmdOrCtrl+I',
          click: (item, focusedWindow) => {
            focusedWindow.openDevTools({ mode: 'detach' })
          },
        },
        {
          label: i18next.t('menu:Developer Tools of WebView'),
          click: (item, focusedWindow) => {
            getStore('layout.webview.ref').openDevTools({ mode: 'detach' })
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
        {
          label: i18next.t('menu:Minimize'),
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize',
        },
        {
          label: i18next.t('menu:Close'),
          accelerator: 'CmdOrCtrl+W',
          role: 'close',
        },
        { type: 'separator' },
        {
          label: i18next.t('menu:Bring All to Front'),
          role: 'front',
        },
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
  template[themepos].submenu.unshift({
    label: th === '__default__' ? 'Default' : capitalize(th),
    type: 'radio',
    checked: config.get('poi.appearance.theme', 'dark') === th,
    click: (item, focusedWindow) => {
      if (th !== config.get('poi.appearance.theme', 'dark')) {
        window.applyTheme(th)
      }
    },
  })
}

export const appMenu = Menu.buildFromTemplate(template)
if (process.platform === 'darwin') {
  Menu.setApplicationMenu(appMenu)
} else {
  const win = remote.getCurrentWindow()
  win.setMenu(appMenu)
  win.setAutoHideMenuBar(true)
  win.setMenuBarVisibility(false)
  if (window.appTray) {
    window.appTray.setContextMenu(appMenu)
  }
}

const themeMenuList = appMenu.items[themepos].submenu.items
config.on('config.set', (path, value) => {
  if (path === 'poi.appearance.theme' && value != null) {
    if (themeMenuList[themes.indexOf(value)]) {
      themeMenuList[themes.indexOf(value)].checked = true
    }
  }
})

import 'electron-react-titlebar/assets/style.css'

export class TitleBarWrapper extends PureComponent {
  state = {
    menu: template,
  }
  handleThemeChange = (path, value) => {
    if (path === 'poi.appearance.theme') {
      let newTemplate = [...this.state.menu]
      for (let i = 0; i < newTemplate[themepos].submenu.length; i++) {
        if (get(newTemplate, `${themepos}.submenu.${i}.type`) === 'radio')
          newTemplate = reduxSet(
            newTemplate,
            [themepos, 'submenu', i, 'checked'],
            get(newTemplate, `${themepos}.submenu.${i}.label`).toLowerCase() === value,
          )
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
    return (
      <TitleBar
        menu={this.state.menu}
        icon={path.join(window.ROOT, 'assets', 'icons', 'poi_32x32.png')}
      />
    )
  }
}
