import fs from 'fs-extra'
import path from 'path-extra'
import Promise from 'bluebird'

import { installFlash } from './utils'

const { ROOT } = global

const BUILD_DIR_NAME = 'build'
const DOWNLOADDIR_NAME = 'download'
const PLATFORMS = ['win32-ia32', 'win32-x64', 'darwin-x64', 'linux-x64']
const PLATFORM_TO_PATHS = {
  'win32-ia32': 'win-ia32',
  'win32-x64': 'win-x64',
  'darwin-x64': 'mac-x64',
  'linux-x64': 'linux-x64',
}

const getFlash = async (poiVersion, all = false) => {
  const BUILD_ROOT = path.join(ROOT, BUILD_DIR_NAME)
  const downloadDir = path.join(BUILD_ROOT, DOWNLOADDIR_NAME)
  const platforms = all ? PLATFORMS : [`${process.platform}-${process.arch}`]
  await fs.remove(path.join(ROOT, 'PepperFlash'))
  return Promise.map(platforms, platform => {
    const flashDir = path.join(ROOT, 'PepperFlash', PLATFORM_TO_PATHS[platform])
    return installFlash(platform, downloadDir, flashDir)
  })
}

export default getFlash
