const fs = require('fs-extra')
const path = require('path-extra')
const ROOT = path.join(__dirname, '..')

const flashPath = (() => {
  switch (process.platform) {
  case 'darwin':
    return path.join(ROOT, 'PepperFlash', `mac-${process.arch}`, 'PepperFlashPlayer.plugin')
  case 'win32':
    return path.join(ROOT, 'PepperFlash', `win-${process.arch}`, 'pepflashplayer.dll')
  case 'linux':
    return path.join(ROOT, 'PepperFlash', `linux-${process.arch}`, 'libpepflashplayer.so')
  }
})()


describe('Flash', () => {
  it('should exist', () => {
    fs.accessSync(flashPath, fs.R_OK | fs.W_OK)
  })
})
