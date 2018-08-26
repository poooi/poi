import { padStart } from 'lodash'

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

const map = new Map()
const slotmap = new Map()

// Magic of tanaka
const resource = [6657, 5699, 3371, 8909, 7719, 6229, 5449, 8561, 2987, 5501, 3127, 9319, 4365, 9811, 9927, 2423, 3439, 1865, 5925, 4409, 5509, 1517, 9695, 9255, 5325, 3691, 5519, 6949, 5607, 9539, 4133, 7795, 5465, 2659, 6381, 6875, 4019, 9195, 5645, 2887, 1213, 1815, 8671, 3015, 3147, 2991, 7977, 7045, 1619, 7909, 4451, 6573, 4545, 8251, 5983, 2849, 7249, 7449, 9477, 5963, 2711, 9019, 7375, 2201, 5631, 4893, 7653, 3719, 8819, 5839, 1853, 9843, 9119, 7023, 5681, 2345, 9873, 6349, 9315, 3795, 9737, 4633, 4173, 7549, 7171, 6147, 4723, 5039, 2723, 7815, 6201, 5999, 5339, 4431, 2911, 4435, 3611, 4423, 9517, 3243]

const rank = ['', 'c1', 'c2', 'c3', 'r1', 'r2', 'sr1', 'sr2', 'sr3']
const itemrank = ['item_c1', 'item_r1', 'sr1', 'sr1', 'sr1', 'sr2']

function createKey(t) {
  let e = 0
  if (null != t && "" != t) {
    for (let i = 0; i < t.length; i++) {
      e += t.charCodeAt(i)
    }
  }
  return e
}

function create(id, seed) {
  const o = id.toString().match(/\d+/)
  if (null == o || 0 == o.length) return ""
  const r = parseInt(o[0])
  const s = createKey(seed)
  const a = null == seed || 0 == seed.length ? 1 : seed.length
  return (17 * (r + 7) * resource[(s + r * a) % 100] % 8973 + 1e3).toString()
}

function join(ip, base, version) {
  if (!ip) {
    return base
  }
  let url = `http://${ip}${base}`
  if (version && parseInt(version) > 1) {
    url = `${url}?version=${version}`
  }
  return url
}

export function getShipImgPath(id, type, damaged, ip, version) {
  const mapkey = [id, type, damaged].toString()
  if (map.has(mapkey)) {
    return join(ip, map.get(mapkey), version)
  }
  if (!shipImgType.includes(type)) {
    throw new Error('Wrong type!')
  }
  if (type === 'album_status' && damaged) {
    throw new Error('Wrong damage status!')
  }
  const ntype = type + (damaged ? '_dmg' : '')
  const seed = 'ship_' + ntype
  const cipherNum = create(id, seed)
  const padId = padStart(id, 4, '0')
  const ret = `/kcs2/resources/ship/${ntype}/${padId}_${cipherNum}.png`
  map.set(mapkey, ret)
  return join(ip, ret, version)
}

export function getShipBackgroundPath(r, ip) {
  return join(ip, `/kcs2/img/common/ship_bg/card/${rank[r]}.png`)
}

export function getSlotItemBackgroundPath(r, ip) {
  return join(ip, `/kcs2/img/common/ship_bg/screen/${itemrank[r]}.png`)
}

export function getSlotItemImgPath(id, type, ip, version) {
  const mapkey = [id, type].toString()
  if (slotmap.has(mapkey)) {
    return join(ip, slotmap.get(mapkey))
  }
  if (!slotItemImgType.includes(type)) {
    throw new Error('Wrong type!')
  }
  const seed = "slot_" + type
  const cipherNum = create(id, seed)
  const padId = padStart(id, 3, '0')
  const ret = `/kcs2/resources/slot/${type}/${padId}_${cipherNum}.png`
  slotmap.set(mapkey, ret)
  return join(ip, ret, version)
}
