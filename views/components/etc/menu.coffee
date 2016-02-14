{remote} = window
{Menu} = remote.require('electron')
{openExternal} = require 'shell'
__ = window.i18n.menu.__.bind(i18n.menu)
__n = window.i18n.menu.__n.bind(i18n.menu)

exeCodeOnWindowHasReloadArea = (win, f) ->
  if win?.reloadArea?
    code = "$('#{win.reloadArea}').#{f}"
    win.webContents.executeJavaScript(code)
template = []
if process.platform != 'darwin'
  template = [
    {
      label: 'Poi'
      submenu: [
        {
          label: __ 'Preferences...'
          click: (item, focusedWindow) ->
            window.openSettings?()
        },
        { type: 'separator' },
        {
          label: __ 'Hide poi'
          click: (item, focusedWindow) ->
            remote.getGlobal('mainWindow').hide()
        },
        {
          label: __ 'Show poi'
          click: (item, focusedWindow) ->
            remote.getGlobal('mainWindow').show()
        },
        { type: 'separator' },
        {
          label: __ 'Resizable'
          type: 'checkbox'
          checked: config.get 'poi.content.resizeable', true
          click: (item, focusedWindow) ->
            remote.getGlobal('mainWindow').setResizable item.checked
            config.set 'poi.content.resizeable', item.checked
        },
        {
          label: __ 'Always on top'
          type: 'checkbox'
          checked: config.get 'poi.content.alwaysOnTop', false
          click: (item, focusedWindow) ->
            remote.getGlobal('mainWindow').setAlwaysOnTop item.checked
            config.set 'poi.content.alwaysOnTop', item.checked
        },
        { type: 'separator' },
        {
          label: __ 'Quit poi'
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
      label: __ 'View'
      submenu: [
        {
          label: __ 'Developer Tools'
          click: (item, focusedWindow) ->
            remote.getGlobal('mainWindow').openDevTools({detach: true})
        },
        {
          label: __ 'Developer Tools of WebView'
          click: (item, focusedWindow) ->
            exeCodeOnWindowHasReloadArea(remote.getGlobal('mainWindow'), 'openDevTools({detach: true})')
        }
      ]
    },
    {
      label: __ 'Themes'
      submenu: [
        {
          label: __ 'Apply Theme'
          submenu: []
        },
        { type: 'separator' },
        {
          label: __ 'Next Theme'
          click: (item, focusedWindow) ->
            all = window.allThemes
            nextTheme = all[(all.indexOf(window.theme) + 1) % all.length]
            window.applyTheme nextTheme
        },
        {
          label: __ 'Previous Theme'
          click: (item, focusedWindow) ->
            all = window.allThemes
            prevTheme = all[(all.indexOf(window.theme) + all.length - 1) % all.length]
            window.applyTheme prevTheme
        }
      ]
    },
    {
      label: __ 'Help'
      role: 'help'
      submenu: [
        {
          label: __ 'Wiki'
          click: ->
            openExternal 'https://github.com/poooi/poi/wiki'
        },
        {
          label: __ 'Poi Statistics'
          click: ->
            openExternal 'http://db.kcwiki.moe/'
        },
        { type: 'separator' },
        {
          label: __ 'Report Issue'
          click: ->
            openExternal 'https://github.com/poooi/poi/issues'
        },
        {
          label: __ 'Search Issues'
          click: ->
            openExternal 'https://github.com/issues?q=+is%3Aissue+user%3Apoooi'
        }
      ]
    }
  ]
else
  template = [
    {
      label: 'Poi'
      submenu: [
        {
          label: __ 'About poi'
          role: 'about'
        },
        { type: 'separator' },
        {
          label: __ 'Preferences...'
          accelerator: 'CmdOrCtrl+,'
          click: (item, focusedWindow) ->
            window.openSettings?()
        },
        { type: 'separator' },
        {
          label: __ 'Services'
          role: 'services'
          submenu: []
        },
        { type: 'separator' },
        {
          label: __ 'Hide poi'
          accelerator: 'CmdOrCtrl+H'
          role: 'hide'
        },
        {
          label: __ 'Hide others'
          accelerator: 'CmdOrCtrl+Shift+H'
          role: 'hideothers'
        },
        {
          label: __ 'Show All'
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: __ 'Resizable'
          type: 'checkbox'
          checked: config.get 'poi.content.resizeable', true
          click: (item, focusedWindow) ->
            remote.getGlobal('mainWindow').setResizable item.checked
            config.set 'poi.content.resizeable', item.checked
        },
        {
          label: __ 'Always on top'
          type: 'checkbox'
          checked: config.get 'poi.content.alwaysOnTop', false
          click: (item, focusedWindow) ->
            remote.getGlobal('mainWindow').setAlwaysOnTop item.checked
            config.set 'poi.content.alwaysOnTop', item.checked
        },
        { type: 'separator' },
        {
          label: __ 'Confirm before exit'
          type: 'checkbox'
          checked: config.get('poi.confirm.quit', false)
          click: (item, focusedWindow) ->
            config.set('poi.confirm.quit', item.checked)
        },
        { type: 'separator' },
        {
          label: __ 'Quit poi'
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
      label: __ 'Edit'
      submenu: [
        {
          label: __ 'Undo'
          accelerator: 'CmdOrCtrl+Z'
          role: 'undo'
        },
        {
          label: __ 'Redo'
          accelerator: 'Shift+CmdOrCtrl+Z'
          role: 'redo'
        },
        { type: 'separator' },
        {
          label: __ 'Cut'
          accelerator: 'CmdOrCtrl+X'
          role: 'cut'
        },
        {
          label: __ 'Copy'
          accelerator: 'CmdOrCtrl+C'
          role: 'copy'
        },
        {
          label: __ 'Paste'
          accelerator: 'CmdOrCtrl+V'
          role: 'paste'
        },
        {
          label: __ 'Select All'
          accelerator: 'CmdOrCtrl+A'
          role: 'selectall'
        }
      ]
    },
    {
      label: __ 'View'
      submenu: [
        {
          label: __ 'Reload'
          accelerator: 'CmdOrCtrl+R'
          click: (item, focusedWindow) ->
            exeCodeOnWindowHasReloadArea(focusedWindow, 'reload()')
        },
        {
          label: __ 'Stop'
          accelerator: 'CmdOrCtrl+.'
          click: (item, focusedWindow) ->
            exeCodeOnWindowHasReloadArea(focusedWindow, 'stop()')
        },
        { type: 'separator' },
        {
          label: __ 'Developer Tools'
          accelerator: 'Alt+CmdOrCtrl+I'
          click: (item, focusedWindow) ->
            focusedWindow.openDevTools({detach: true})
        },
        {
          label: __ 'Developer Tools of WebView'
          click: (item, focusedWindow) ->
            exeCodeOnWindowHasReloadArea(focusedWindow, 'openDevTools({detach: true})')
        }
      ]
    },
    {
      label: __ 'Themes'
      submenu: [
        {
          label: __ 'Apply Theme'
          submenu: []
        },
        { type: 'separator' },
        {
          label: __ 'Next Theme'
          accelerator: 'CmdOrCtrl+T'
          click: (item, focusedWindow) ->
            all = window.allThemes
            nextTheme = all[(all.indexOf(window.theme) + 1) % all.length]
            window.applyTheme nextTheme
        },
        {
          label: __ 'Previous Theme'
          accelerator: 'CmdOrCtrl+Shift+T'
          click: (item, focusedWindow) ->
            all = window.allThemes
            prevTheme = all[(all.indexOf(window.theme) + all.length - 1) % all.length]
            window.applyTheme prevTheme
        }
      ]
    },
    {
      label: __ 'Window'
      role: 'window'
      submenu: [
        {
          label: __ 'Minimize'
          accelerator: 'CmdOrCtrl+M'
          role: 'minimize'
        },
        {
          label: __ 'Close'
          accelerator: 'CmdOrCtrl+W'
          role: 'close'
        },
        { type: 'separator' },
        {
          label: __ 'Bring All to Front'
          role: 'front'
        }
      ]
    },
    {
      label: __ 'Help'
      role: 'help'
      submenu: [
        {
          label: __ 'Wiki'
          click: ->
            openExternal 'https://github.com/poooi/poi/wiki'
        },
        {
          label: __ 'Poi Statistics'
          click: ->
            openExternal 'http://db.kcwiki.moe/'
        },
        { type: 'separator' },
        {
          label: __ 'Report Issue'
          click: ->
            openExternal 'https://github.com/poooi/poi/issues'
        },
        {
          label: __ 'Search Issues'
          click: ->
            openExternal 'https://github.com/issues?q=+is%3Aissue+user%3Apoooi'
        }
      ]
    }
  ]
if process.platform == 'darwin' then themepos = 3 else themepos = 2
window.allThemes.map (th) ->
  template[themepos].submenu[0].submenu.push
    label: if th is '__default__' then 'Default' else th.charAt(0).toUpperCase() + th.slice(1)
    type: 'radio'
    checked: window.theme is th
    click: (item, focusedWindow) ->
      if th isnt window.theme
        window.applyTheme th
appMenu = Menu.buildFromTemplate(template)
if process.platform == 'darwin'
  Menu.setApplicationMenu(appMenu)
else
  win = remote.getCurrentWindow()
  win.setMenu(appMenu)
  win.setAutoHideMenuBar(true)
  win.setMenuBarVisibility(false)
  if process.platform == 'win32'
    window.appIcon?.setContextMenu(appMenu)
# Ugly hard-coded hack... Hope Electron can provide some better interface in the future...
themeMenuList = appMenu.items[themepos].submenu.items[0].submenu.items
window.addEventListener 'theme.change', (e) ->
  themeMenuList[window.allThemes.indexOf(e.detail.theme)].checked = true
