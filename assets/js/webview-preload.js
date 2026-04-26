const { contextBridge, ipcRenderer } = require('electron')

const ipc = {
  on: (channel, listener) => ipcRenderer.on(channel, listener),
  once: (channel, listener) => ipcRenderer.once(channel, listener),
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  removeListener: (channel, listener) => ipcRenderer.removeListener(channel, listener),
  removeAllListeners: channel => ipcRenderer.removeAllListeners(channel)
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('ipc', ipc)
} else {
  window.ipc = ipc
}

require('./xhr-hack')
require('./resource-hack')
require('./page-align')
require('./cookie-hack')
require('./disable-tab')
require('./capture-page')
