import * as remote from '@electron/remote'
import fs from 'fs-extra'
import { padStart } from 'lodash'
import path from 'path'
import url from 'url'
import { config } from 'views/env'
import { createCipher } from 'views/utils/ship-img-cipher'

const getCachePath = (pathname = '') => {
  const dir = config.get('poi.misc.cache.path', remote.getGlobal('DEFAULT_CACHE_PATH'))
  return path.join(String(dir ?? ''), pathname)
}

const findHackFilePath = (pathname = '') => {
  const originFilePath = getCachePath(path.join('KanColle', pathname))
  const sp = originFilePath.split('.')
  const ext = sp.pop()
  sp.push('hack')
  if (ext) {
    sp.push(ext)
  }
  const hackedFilePath = sp.join('.')
  try {
    fs.accessSync(hackedFilePath, fs.constants.R_OK)
    return hackedFilePath
  } catch (_) {
    try {
      fs.accessSync(originFilePath, fs.constants.R_OK)
      return originFilePath
    } catch (_) {
      return undefined
    }
  }
}

const pathToFileURL = (filePath = '') =>
  url.pathToFileURL(filePath.split(path.sep).join(path.posix.sep))

export const shipImgType = [
  'banner',
  'card',
  'remodel',
  'character_up',
  'character_full',
  'full',
  'supply_character',
  'album_status',
]

export const slotItemImgType = [
  'airunit_banner',
  'airunit_fairy',
  'airunit_name',
  'btxt_flat',
  'cart_t',
  'card',
  'item_character',
  'item_on',
  'item_up',
  'remodel',
  'statustop_item',
]

const map = new Map<string, string>()
const slotmap = new Map<string, string>()

const rank = ['', 'c1', 'c2', 'c3', 'r1', 'r2', 'sr1', 'sr2', 'sr3']
const itemrank = ['item_c1', 'item_r1', 'sr1', 'sr1', 'sr1', 'sr2']

function join(ip: string | undefined, base: string, version?: string | number): string {
  const hackedPath = findHackFilePath(base)
  if (hackedPath) {
    return pathToFileURL(hackedPath).href
  }
  if (!ip) {
    return base
  }
  let url = `https://${ip}${base}`
  if (version && parseInt(String(version)) > 1) {
    url = `${url}?version=${version}`
  }
  return url
}

export function getShipImgPath(
  id: number,
  type: string,
  damaged: boolean,
  ip: string | undefined,
  version?: string | number,
): string {
  // reset damaged status according to main.js
  if (type === 'album_status') {
    damaged = false
  }
  if (['banner_g', 'banner2_g', 'banner3_g'].includes(type)) {
    damaged = true
  }
  // for enemy ships, damaged images are the same; reset the damaged status
  // exceptions are 北方栖姫
  if (id > 1500 && ![1587, 1588, 1589, 1590].includes(id)) {
    damaged = false
  }
  const mapkey = [id, type, damaged].toString()
  if (map.has(mapkey)) {
    return join(ip, map.get(mapkey)!, version)
  }
  if (!shipImgType.includes(type)) {
    throw new Error('Wrong type!')
  }
  if (type === 'album_status' && damaged) {
    throw new Error('Wrong damage status!')
  }
  const ntype = type + (damaged ? '_dmg' : '')
  const seed = 'ship_' + ntype
  const cipherNum = createCipher(id, seed)
  const padId = padStart(String(id), 4, '0')
  const ret = `/kcs2/resources/ship/${ntype}/${padId}_${cipherNum}.png`
  map.set(mapkey, ret)
  return join(ip, ret, version)
}

export function getShipBackgroundPath(r: number, ip?: string): string {
  return join(ip, `/kcs2/img/common/ship_bg/card/${rank[r]}.png`)
}

export function getSlotItemBackgroundPath(r: number, ip?: string): string {
  return join(ip, `/kcs2/img/common/ship_bg/screen/${itemrank[r]}.png`)
}

export function getSlotItemImgPath(
  id: number,
  type: string,
  ip: string | undefined,
  version?: string | number,
): string {
  const mapkey = [id, type].toString()
  if (slotmap.has(mapkey)) {
    return join(ip, slotmap.get(mapkey)!)
  }
  if (!slotItemImgType.includes(type)) {
    throw new Error('Wrong type!')
  }
  const seed = 'slot_' + type
  const cipherNum = createCipher(id, seed)
  const padId = padStart(String(id), 4, '0')
  const ret = `/kcs2/resources/slot/${type}/${padId}_${cipherNum}.png`
  slotmap.set(mapkey, ret)
  return join(ip, ret, version)
}
