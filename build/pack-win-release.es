
import path from 'path-extra'

import { compress7z } from './utils'
import { log } from '../lib/utils'

const { ROOT } = global

const packWinRelease = async (poiVersion) => {
  let target = path.join(ROOT, 'dist', 'win-unpacked')
  let dest = path.join(ROOT, 'dist', 'win', `poi-${poiVersion}-win-x64.7z`)
  await compress7z(target, dest)
  target = path.join(ROOT, 'dist', 'win-ia32-unpacked')
  dest = path.join(ROOT, 'dist', 'win-ia32', `poi-${poiVersion}-win-ia32.7z`)
  await compress7z(target, dest)
  log("Release packed up")
}

export default packWinRelease
