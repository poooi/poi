import React, { PureComponent } from 'react'
import { remote, shell } from 'electron'
import { TitleBar } from 'electron-react-titlebar'
import { reduxSet } from 'views/utils/tools'
import { get, capitalize } from 'lodash'
import path from 'path'
import i18next from 'views/env-parts/i18next'

const { Menu } = remote.require('electron')
const { openExternal } = shell
const { config } = window

const exeCodeOnWindowHasReloadArea = (win, f) => {
  if ((win || {}).reloadArea) {
    const code = `$('${win.reloadArea}').${f}`
    win.webContents.executeJavaScript(code)
  }
}

const resetViews = () => {
  const { availWidth, availHeight, availTop, availLeft } = window.screen
  const webViewConfig = {}
  if (availHeight < 900) { // setting bar will hide below 900 px
    webViewConfig.width = 800
  }
  config.set('poi.layout', 'horizontal')
  config.set('poi.webview', webViewConfig)
  config.set('poi.zoomLevel', 1)
  window.setImmediate(() => {
    remote.getCurrentWindow().setPosition(availLeft, availTop)
    remote.getCurrentWindow().setSize(availWidth, availHeight)
  })
}

let template = []

if (process.platform !== 'darwin') {
  template = [
    {
      label: 'Poi',
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
            exeCodeOnWindowHasReloadArea(focusedWindow, 'reload()')
          },
        },
        {
          label: i18next.t('menu:Stop'),
          accelerator: 'Ctrl+.',
          click: (item, focusedWindow) => {
            exeCodeOnWindowHasReloadArea(focusedWindow, 'stop()')
          },
        },
        {
          label: i18next.t('menu:Developer Tools'),
          accelerator: 'Ctrl+Shift+I',
          click: (item, focusedWindow) => {
            focusedWindow.openDevTools({mode: 'detach'})
          },
        },
        {
          label: i18next.t('menu:Developer Tools of WebView'),
          click: (item, focusedWindow) => {
            exeCodeOnWindowHasReloadArea(remote.getGlobal('mainWindow'), 'openDevTools({mode: "detach"})')
          },
        },
      ],
    },
    {
      label: i18next.t('menu:Themes'),
      submenu: [
        { type: 'separator' },
        {
          label: i18next.t('menu:Next Theme'),
          click: (item, focusedWindow) => {
            const all = window.allThemes
            const nextTheme = all[(all.indexOf(window.theme) + 1) % all.length]
            window.applyTheme(nextTheme)
          },
        },
        {
          label: i18next.t('menu:Previous Theme'),
          click: (item, focusedWindow) => {
            const all = window.allThemes
            const prevTheme = all[(all.indexOf(window.theme) + all.length - 1) % all.length]
            window.applyTheme(prevTheme)
          },
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
          label: i18next.t('menu:Poi Statistics'),
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
      label: 'Poi',
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
            exeCodeOnWindowHasReloadArea(focusedWindow, 'reload()')
          },
        },
        {
          label: i18next.t('menu:Stop'),
          accelerator: 'CmdOrCtrl+.',
          click: (item, focusedWindow) => {
            exeCodeOnWindowHasReloadArea(focusedWindow, 'stop()')
          },
        },
        { type: 'separator' },
        {
          label: i18next.t('menu:Developer Tools'),
          accelerator: 'Alt+CmdOrCtrl+I',
          click: (item, focusedWindow) => {
            focusedWindow.openDevTools({mode: 'detach'})
          },
        },
        {
          label: i18next.t('menu:Developer Tools of WebView'),
          click: (item, focusedWindow) => {
            exeCodeOnWindowHasReloadArea(focusedWindow, 'openDevTools({mode: "detach"})')
          },
        },
      ],
    },
    {
      label: i18next.t('menu:Themes'),
      submenu: [
        { type: 'separator' },
        {
          label: i18next.t('menu:Next Theme'),
          accelerator: 'CmdOrCtrl+T',
          click: (item, focusedWindow) => {
            const all = window.allThemes
            const nextTheme = all[(all.indexOf(window.theme) + 1) % all.length]
            window.applyTheme(nextTheme)
          },
        },
        {
          label: i18next.t('menu:Previous Theme'),
          accelerator: 'CmdOrCtrl+Shift+T',
          click: (item, focusedWindow) => {
            const all = window.allThemes
            const prevTheme = all[(all.indexOf(window.theme) + all.length - 1) % all.length]
            window.applyTheme(prevTheme)
          },
        },
      ],
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
          label: i18next.t('menu:Poi Statistics'),
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
for (let i = window.normalThemes.length - 1; i >=0; i--) {
  const th = window.normalThemes[i]
  template[themepos].submenu.unshift({
    label: th === '__default__' ? 'Default' : capitalize(th),
    type: 'radio',
    checked: window.theme === th,
    enabled: !window.isVibrant || window.vibrantThemes.includes(th),
    click: (item, focusedWindow) => {
      if (th !== window.theme) {
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
  if (['win32', 'linux'].includes(process.platform) && window.appIcon) {
    window.appIcon.setContextMenu(appMenu)
  }
}

const themeMenuList = appMenu.items[themepos].submenu.items
config.on('config.set', (path, value) => {
  if (path === 'poi.theme' && value != null) {
    if (themeMenuList[window.normalThemes.indexOf(value)]){
      themeMenuList[window.normalThemes.indexOf(value)].checked = true
    }
  }
  if (path === 'poi.vibrant') {
    window.normalThemes.forEach((theme, i) => themeMenuList[i].enabled = !value || window.vibrantThemes.includes(theme))
  }
})

import 'electron-react-titlebar/assets/style.css'

export class TitleBarWrapper extends PureComponent {
  state = {
    menu: template,
  }
  handleThemeChange = (path, value) => {
    if (path === 'poi.theme') {
      let newTemplate = [...this.state.menu]
      for (let i = 0; i < newTemplate[themepos].submenu.length; i++) {
        if (get(newTemplate, `${themepos}.submenu.${i}.type`) === 'radio')
          newTemplate = reduxSet(newTemplate, [themepos, 'submenu', i, 'checked'], get(newTemplate, `${themepos}.submenu.${i}.label`).toLowerCase() === value)
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
  render () {
    return (
      <TitleBar menu={this.state.menu} icon={path.join(window.ROOT, 'assets', 'icons', 'poi_32x32.png')} currentWindow={remote.getCurrentWindow()} />
    )
  }
}
