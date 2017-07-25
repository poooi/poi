import React, { Component } from 'react'
import { remote, shell } from 'electron'
import { TitleBar } from 'electron-react-titlebar'
import { reduxSet } from 'views/utils/tools'
import { get } from 'lodash'
import path from 'path'

const {Menu} = remote.require('electron')
const {openExternal} = shell
const {i18n, config} = window
const __ = window.i18n.menu.__.bind(i18n.menu)

const exeCodeOnWindowHasReloadArea = (win, f) => {
  if ((win || {}).reloadArea) {
    const code = `$('${win.reloadArea}').${f}`
    win.webContents.executeJavaScript(code)
  }
}

let template = []

if (process.platform !== 'darwin') {
  template = [
    {
      label: 'Poi',
      submenu: [
        {
          label: __('Preferences...'),
          click: (item, focusedWindow) => {
            window.openSettings()
          },
        },
        { type: 'separator' },
        {
          label: __('Hide poi'),
          click: (item, focusedWindow) => {
            remote.getGlobal('mainWindow').hide()
          },
        },
        {
          label: __('Show poi'),
          click: (item, focusedWindow) => {
            remote.getGlobal('mainWindow').show()
          },
        },
        { type: 'separator' },
        {
          label: __('Resizable'),
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
          label: __('Always on top'),
          type: 'checkbox',
          checked: config.get('poi.content.alwaysOnTop', false),
          click: (item, focusedWindow) => {
            remote.getGlobal('mainWindow').setAlwaysOnTop(item.checked)
            config.set('poi.content.alwaysOnTop', item.checked)
          },
        },
        { type: 'separator' },
        {
          label: __('Quit poi'),
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
      label: __('View'),
      submenu: [
        {
          label: __('Reload'),
          accelerator: 'Ctrl+R',
          click: (item, focusedWindow) => {
            exeCodeOnWindowHasReloadArea(focusedWindow, 'reload()')
          },
        },
        {
          label: __('Stop'),
          accelerator: 'Ctrl+.',
          click: (item, focusedWindow) => {
            exeCodeOnWindowHasReloadArea(focusedWindow, 'stop()')
          },
        },
        {
          label: __('Developer Tools'),
          click: (item, focusedWindow) => {
            remote.getGlobal('mainWindow').openDevTools({detach: true})
          },
        },
        {
          label: __('Developer Tools of WebView'),
          click: (item, focusedWindow) => {
            exeCodeOnWindowHasReloadArea(remote.getGlobal('mainWindow'), 'openDevTools({detach: true})')
          },
        },
      ],
    },
    {
      label: __('Themes'),
      submenu: [
        { type: 'separator' },
        {
          label: __('Next Theme'),
          click: (item, focusedWindow) => {
            const all = window.allThemes
            const nextTheme = all[(all.indexOf(window.theme) + 1) % all.length]
            window.applyTheme(nextTheme)
          },
        },
        {
          label: __('Previous Theme'),
          click: (item, focusedWindow) => {
            const all = window.allThemes
            const prevTheme = all[(all.indexOf(window.theme) + all.length - 1) % all.length]
            window.applyTheme(prevTheme)
          },
        },
      ],
    },
    {
      label: __('Help'),
      role: 'help',
      submenu: [
        {
          label: __('Wiki'),
          click: () => {
            openExternal('https://github.com/poooi/poi/wiki')
          },
        },
        {
          label: __('Poi Statistics'),
          click: () => {
            openExternal('http://db.kcwiki.moe/')
          },
        },
        { type: 'separator' },
        {
          label: __('Report Issue'),
          click: () => {
            openExternal('https://github.com/poooi/poi/issues')
          },
        },
        {
          label: __('Search Issues'),
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
          label: __('About poi'),
          role: 'about',
        },
        { type: 'separator' },
        {
          label: __('Preferences...'),
          accelerator: 'CmdOrCtrl+,',
          click: (item, focusedWindow) => {
            window.openSettings()
          },
        },
        { type: 'separator' },
        {
          label: __('Services'),
          role: 'services',
          submenu: [],
        },
        { type: 'separator' },
        {
          label: __('Hide poi'),
          accelerator: 'CmdOrCtrl+H',
          role: 'hide',
        },
        {
          label: __('Hide others'),
          accelerator: 'CmdOrCtrl+Shift+H',
          role: 'hideothers',
        },
        {
          label: __('Show All'),
          role: 'unhide',
        },
        { type: 'separator' },
        {
          label: __('Resizable'),
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
          label: __('Always on top'),
          type: 'checkbox',
          checked: config.get('poi.content.alwaysOnTop', false),
          click: (item, focusedWindow) => {
            remote.getGlobal('mainWindow').setAlwaysOnTop(item.checked)
            config.set('poi.content.alwaysOnTop', item.checked)
          },
        },
        { type: 'separator' },
        {
          label: __('Confirm before exit'),
          type: 'checkbox',
          checked: config.get('poi.confirm.quit', false),
          click: (item, focusedWindow) => {
            config.set('poi.confirm.quit', item.checked)
          },
        },
        { type: 'separator' },
        {
          label: __('Quit poi'),
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
      label: __('Edit'),
      submenu: [
        {
          label: __('Undo'),
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo',
        },
        {
          label: __('Redo'),
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo',
        },
        { type: 'separator' },
        {
          label: __('Cut'),
          accelerator: 'CmdOrCtrl+X',
          role: 'cut',
        },
        {
          label: __('Copy'),
          accelerator: 'CmdOrCtrl+C',
          role: 'copy',
        },
        {
          label: __('Paste'),
          accelerator: 'CmdOrCtrl+V',
          role: 'paste',
        },
        {
          label: __('Select All'),
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall',
        },
      ],
    },
    {
      label: __('View'),
      submenu: [
        {
          label: __('Reload'),
          accelerator: 'CmdOrCtrl+R',
          click: (item, focusedWindow) => {
            exeCodeOnWindowHasReloadArea(focusedWindow, 'reload()')
          },
        },
        {
          label: __('Stop'),
          accelerator: 'CmdOrCtrl+.',
          click: (item, focusedWindow) => {
            exeCodeOnWindowHasReloadArea(focusedWindow, 'stop()')
          },
        },
        { type: 'separator' },
        {
          label: __ ('Developer Tools'),
          accelerator: 'Alt+CmdOrCtrl+I',
          click: (item, focusedWindow) => {
            focusedWindow.openDevTools({detach: true})
          },
        },
        {
          label: __('Developer Tools of WebView'),
          click: (item, focusedWindow) => {
            exeCodeOnWindowHasReloadArea(focusedWindow, 'openDevTools({detach: true})')
          },
        },
      ],
    },
    {
      label: __('Themes'),
      submenu: [
        { type: 'separator' },
        {
          label: __('Next Theme'),
          accelerator: 'CmdOrCtrl+T',
          click: (item, focusedWindow) => {
            const all = window.allThemes
            const nextTheme = all[(all.indexOf(window.theme) + 1) % all.length]
            window.applyTheme(nextTheme)
          },
        },
        {
          label: __('Previous Theme'),
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
      label: __('Window'),
      role: 'window',
      submenu: [
        {
          label: __('Minimize'),
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize',
        },
        {
          label: __('Close'),
          accelerator: 'CmdOrCtrl+W',
          role: 'close',
        },
        { type: 'separator' },
        {
          label: __('Bring All to Front'),
          role: 'front',
        },
      ],
    },
    {
      label: __('Help'),
      role: 'help',
      submenu: [
        {
          label: __('Wiki'),
          click: () => {
            openExternal('https://github.com/poooi/poi/wiki')
          },
        },
        {
          label: __('Poi Statistics'),
          click: () => {
            openExternal('http://db.kcwiki.moe/')
          },
        },
        { type: 'separator' },
        {
          label: __('Report Issue'),
          click: () => {
            openExternal('https://github.com/poooi/poi/issues')
          },
        },
        {
          label: __('Search Issues'),
          click: () => {
            openExternal('https://github.com/issues?q=+is%3Aissue+user%3Apoooi')
          },
        },
      ],
    },
  ]
}

const themepos = process.platform === 'darwin' ? 3 : 2
for (let i = window.allThemes.length - 1; i >=0; i--) {
  const th = window.allThemes[i]
  template[themepos].submenu.unshift({
    label: th === '__default__' ? 'Default' : th.charAt(0).toUpperCase() + th.slice(1),
    type: 'radio',
    checked: window.theme === th,
    click: (item, focusedWindow) => {
      if (th !== window.theme) {
        window.applyTheme(th)
      }
    },
  })
}

const appMenu = Menu.buildFromTemplate(template)
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
    themeMenuList[window.allThemes.indexOf(value)].checked = true
  }
})

export class TitleBarWrapper extends Component {
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
    return <TitleBar menu={this.state.menu} icon={path.join(window.ROOT, 'assets', 'icons', 'poi_32x32.png')} />
  }
}
