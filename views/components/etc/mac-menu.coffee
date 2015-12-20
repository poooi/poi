{remote} = window
{Menu} = remote.require('electron')

exeCodeOnWindowHasReloadArea = (win, f) ->
  if win?.reloadArea?
    code = "$('#{win.reloadArea}').#{f}"
    win.webContents.executeJavaScript(code)
template = [
  {
    label: 'Poi'
    submenu: [
      {
        label: 'About Poi'
        role: 'about'
      },
      { type: 'separator' },
      {
        label: 'Services'
        role: 'services'
        submenu: []
      },
      { type: 'separator' },
      {
        label: 'Hide Poi'
        accelerator: 'CmdOrCtrl+H'
        role: 'hide'
      },
      {
        label: 'Hide Others'
        accelerator: 'CmdOrCtrl+Shift+H'
        role: 'hideothers'
      },
      {
        label: 'Show All'
        role: 'unhide'
      },
      { type: 'separator' },
      {
        label: 'Warn Before Quitting'
        type: 'checkbox'
        checked: config.get('poi.confirm.quit', false)
        click: (item, focusedWindow) ->
          config.set('poi.confirm.quit', item.checked)
      },
      { type: 'separator' },
      {
        label: 'Quit Poi'
        accelerator: 'CmdOrCtrl+Q'
        click: ->
          # The terminate selector will ignore the 'poi.confirm.quit' setting
          # and try to close any (plugin) window it can close first.
          # So here we should only try to close the main window and let it handle all the rest.
          remote.getCurrentWindow().focus()
          window.close()
      }
    ]
  },
  {
    label: 'Edit'
    submenu: [
      {
        label: 'Undo'
        accelerator: 'CmdOrCtrl+Z'
        role: 'undo'
      },
      {
        label: 'Redo'
        accelerator: 'Shift+CmdOrCtrl+Z'
        role: 'redo'
      },
      { type: 'separator' },
      {
        label: 'Cut'
        accelerator: 'CmdOrCtrl+X'
        role: 'cut'
      },
      {
        label: 'Copy'
        accelerator: 'CmdOrCtrl+C'
        role: 'copy'
      },
      {
        label: 'Paste'
        accelerator: 'CmdOrCtrl+V'
        role: 'paste'
      },
      {
        label: 'Select All'
        accelerator: 'CmdOrCtrl+A'
        role: 'selectall'
      }
    ]
  },
  {
    label: 'View'
    submenu: [
      {
        label: 'Reload'
        accelerator: 'CmdOrCtrl+R'
        click: (item, focusedWindow) ->
          exeCodeOnWindowHasReloadArea(focusedWindow, 'reload()')
      },
      {
        label: 'Stop'
        accelerator: 'CmdOrCtrl+.'
        click: (item, focusedWindow) ->
          exeCodeOnWindowHasReloadArea(focusedWindow, 'stop()')
      },
      { type: 'separator' },
      {
        label: 'Open Developer Tools'
        accelerator: 'Alt+CmdOrCtrl+I'
        click: (item, focusedWindow) ->
          focusedWindow.openDevTools({detach: true})
      },
      {
        label: 'Open Developer Tools of WebView'
        click: (item, focusedWindow) ->
          exeCodeOnWindowHasReloadArea(focusedWindow, 'openDevTools({detach: true})')
      }
    ]
  },
  {
    label: 'Themes'
    submenu: [
      {
        label: 'Apply Theme'
        submenu: []
      },
      { type: 'separator' },
      {
        label: 'Next Theme'
        accelerator: 'CmdOrCtrl+T'
        click: (item, focusedWindow) ->
          all = window.allThemes
          nextTheme = all[(all.indexOf(window.theme) + 1) % all.length]
          window.applyTheme nextTheme
      },
      {
        label: 'Previous Theme'
        accelerator: 'CmdOrCtrl+Shift+T'
        click: (item, focusedWindow) ->
          all = window.allThemes
          prevTheme = all[(all.indexOf(window.theme) + all.length - 1) % all.length]
          window.applyTheme prevTheme
      }
    ]
  },
  {
    label: 'Window'
    role: 'window'
    submenu: [
      {
        label: 'Minimize'
        accelerator: 'CmdOrCtrl+M'
        role: 'minimize'
      },
      {
        label: 'Close'
        accelerator: 'CmdOrCtrl+W'
        role: 'close'
      },
      { type: 'separator' },
      {
        label: 'Bring All to Front'
        role: 'front'
      }
    ]
  },
  {
    label: 'Help'
    role: 'help'
    submenu: [
      {
        label: 'Wiki'
        click: ->
          openExternal 'https://github.com/poooi/poi/wiki'
      },
      {
        label: 'Poi Statistics'
        click: ->
          openExternal 'http://db.kcwiki.moe/'
      },
      { type: 'separator' },
      {
        label: 'Report Issue'
        click: ->
          openExternal 'https://github.com/poooi/poi/issues'
      },
      {
        label: 'Search Issues'
        click: ->
          openExternal 'https://github.com/issues?q=+is%3Aissue+user%3Apoooi'
      }
    ]
  }
]
window.allThemes.map (th) ->
  template[3].submenu[0].submenu.push
    label: if th is '__default__' then 'Default' else th.charAt(0).toUpperCase() + th.slice(1)
    type: 'radio'
    checked: window.theme is th
    click: (item, focusedWindow) ->
      if th isnt window.theme
        window.applyTheme th
appMenu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(appMenu)
# Ugly hard-coded hack... Hope Electron can provide some better interface in the future...
themeMenuList = appMenu.items[3].submenu.items[0].submenu.items
window.addEventListener 'theme.change', (e) ->
  themeMenuList[window.allThemes.indexOf(e.detail.theme)].checked = true
