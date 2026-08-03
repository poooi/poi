import type { APIShip } from 'kcsapi/api_port/port/response'
import type { APIMstShip, APIMstSlotitem } from 'kcsapi/api_start2/getData/response'
import type { Equip, EquipsState } from 'views/redux/info/equips'

import { Intent } from '@blueprintjs/core'
import _ from 'lodash'

import { shipAvatarColor } from './color'
import { between } from './tools'

const aircraftExpTable = [0, 10, 25, 40, 55, 70, 85, 100, 121]
const aircraftLevelBonus: Record<number, number[]> = {
  6: [0, 0, 2, 5, 9, 14, 14, 22, 22],
  7: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  8: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  11: [0, 1, 1, 1, 1, 3, 3, 6, 6],
  26: [0, 0, 2, 5, 9, 14, 14, 22, 22],
  45: [0, 0, 2, 5, 9, 14, 14, 22, 22],
  47: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  48: [0, 0, 2, 5, 9, 14, 14, 22, 22],
  56: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  57: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  58: [0, 0, 0, 0, 0, 0, 0, 0, 0],
}

const speedInterpretation: Record<number, string> = {
  5: 'Slow',
  10: 'Fast',
  15: 'Fast+',
  20: 'Fastest',
}

const speedStyles: Record<number, React.CSSProperties> = {
  [15]: { color: '#1E88E5' },
  [20]: { color: '#64B5F6' },
}

const uncountedSlotitemId = [42, 43, 145, 146, 150, 241]

/**
 * poi extends Blueprint's `intent` CSS convention with custom color classes.
 * Blueprint applies `intent` verbatim as a class suffix, so these render through
 * poi's own stylesheet rather than Blueprint's named intents.
 */
export type MaterialIntent = 'red' | 'orange' | 'yellow' | 'green'

/**
 * Bridge a {@link MaterialIntent} to Blueprint's `Intent` prop type. The values are
 * disjoint from Blueprint's `Intent`, so the assertion is confined to this one boundary
 * instead of being repeated at every call site.
 */
export const asIntent = (intent: MaterialIntent): Intent =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  intent as unknown as Intent

export function getMaterialStyle(percent: number): MaterialIntent {
  if (percent <= 50) return 'red'
  else if (percent <= 75) return 'orange'
  else if (percent < 100) return 'yellow'
  else return 'green'
}

export function getCondStyle(cond: number): string {
  let s = 'poi-ship-cond poi-ship-cond-'
  if (cond > 52) s += '53'
  else if (cond > 49) s += '50'
  else if (cond == 49) s += '49'
  else if (cond > 39) s += '40'
  else if (cond > 29) s += '30'
  else if (cond > 19) s += '20'
  else s += '0'
  s += window.isDarkTheme ? ' dark' : ' light'
  return s
}

export function getShipAvatarColorByType(shipType: number): string {
  switch (shipType) {
    case 1:
      return shipAvatarColor.GREY_BLUE
    case 2:
      return shipAvatarColor.GREEN
    case 3:
    case 4:
    case 21:
      return shipAvatarColor.YELLOW
    case 5:
    case 6:
      return shipAvatarColor.ORANGE
    case 8:
    case 9:
    case 10:
    case 12:
      return shipAvatarColor.RED
    case 7:
    case 11:
    case 18:
      return shipAvatarColor.BLUE
    case 13:
    case 14:
      return shipAvatarColor.PURPLE
    default:
      return shipAvatarColor.WHITE
  }
}

export function getShipAvatarColorByRange(rng: number): string {
  switch (rng) {
    case 1:
      return shipAvatarColor.GREEN
    case 2:
      return shipAvatarColor.YELLOW
    case 3:
      return shipAvatarColor.ORANGE
    case 4:
      return shipAvatarColor.RED
    default:
      return shipAvatarColor.BLACK
  }
}

export function getShipAvatarColorByTag(tag: number, color: string[]): string {
  return Number.isInteger(tag) && tag > 0 ? `${color[tag - 1]}60` : shipAvatarColor.BLACK
}

export function getShipAvatarColorBySpeed(speed: number): string {
  switch (speed) {
    case 5:
      return shipAvatarColor.BLUE
    case 10:
      return shipAvatarColor.GREEN
    case 15:
      return shipAvatarColor.YELLOW
    case 20:
      return shipAvatarColor.RED
    default:
      return shipAvatarColor.BLUE
  }
}

// The real per-rank backgrounds (kcs2/img/common/ship_bg/{card,screen}/*.png) are a
// hex-tile texture behind a metal card frame; sr1+ swap the hex tile for white-heavy
// pastel gear graphics whose colours wheel around a central burst — hence a conic
// sweep rather than a linear band.
//
// The stop angles are *measured* from the source art, not eyeballed: sampling
// screen/sr1 and screen/sr2+sr3 in polar coordinates and taking the
// saturation-weighted circular mean hue per angular bucket. That fit also picks the
// centre — scoring candidate centres by hue error against every pixel lands on
// 50% 50% for all three, and it says the sweep runs green -> blue -> magenta -> red
// -> yellow clockwise (an earlier hand-tuned version had the wheel backwards).
// Stops are then reduced to the fewest that stay within ~7 degrees of hue error.
//
// How colourful a layer ends up is chroma x its own alpha — the white base under
// it only moves lightness, so lowering that base cannot rescue a washed-out sweep.
// sr1 is meant to read gentler than sr2/sr3, so it is budgeted rather than merely
// faded: mean effective chroma ~64 against vivid's ~71. Around ~42 it stopped
// looking soft and just looked grey. Its lightness stays above vivid's (0.70 vs
// 0.66) so the tier still reads as the pastel one rather than a dimmer copy.
//
// Saturation is uniform per gradient except through the purple band, which is
// pulled down by up to a third (gaussian on hue distance from ~270deg, so the blue
// and magenta either side taper rather than step). Violet at equal HSL saturation
// carries far more visual weight than the yellows and greens, and read as a stripe
// across the sweep rather than part of it.
//
// Every layer is semi-transparent so the theme background bleeds through — the
// tint darkens on dark themes and stays light on light themes, keeping text on
// top readable either way.
const softRainbow = `
  conic-gradient(
    at 50% 110%,
    rgb(139 228 149 / 0.5) 0deg,
    rgb(139 146 228 / 0.5) 113deg,
    rgb(228 139 214 / 0.5) 150deg,
    rgb(228 139 207 / 0.5) 180deg,
    rgb(228 140 139 / 0.5) 218deg,
    rgb(228 142 139 / 0.5) 248deg,
    rgb(185 228 139 / 0.5) 338deg,
    rgb(139 228 149 / 0.5) 360deg
  ),
  rgb(252 252 250 / 0.4)
`
const vividRainbow = `
  radial-gradient(circle at 25% 20%, rgb(255 255 255 / 0.6) 0%, rgb(255 255 255 / 0) 8%),
  radial-gradient(circle at 75% 15%, rgb(255 255 255 / 0.6) 0%, rgb(255 255 255 / 0) 6%),
  radial-gradient(circle at 60% 70%, rgb(255 255 255 / 0.6) 0%, rgb(255 255 255 / 0) 6%),
  conic-gradient(
    at 50% 110%,
    rgb(109 227 180 / 0.65) 0deg,
    rgb(109 138 227 / 0.65) 83deg,
    rgb(161 109 227 / 0.65) 98deg,
    rgb(227 109 215 / 0.65) 128deg,
    rgb(227 109 184 / 0.65) 165deg,
    rgb(227 113 109 / 0.65) 180deg,
    rgb(227 124 109 / 0.65) 233deg,
    rgb(227 205 109 / 0.65) 263deg,
    rgb(172 227 109 / 0.65) 323deg,
    rgb(109 227 158 / 0.65) 338deg,
    rgb(109 227 180 / 0.65) 360deg
  ),
  rgb(251 250 246 / 0.35)
`

// sr3 is sr2 plus scattered sakura petals. A petal is a shape rather than a colour
// ramp, so it comes in as inline SVG — two tiles at sizes that share no small common
// factor (68 and 95), so their repeats drift against each other and the scatter
// never resolves into a visible grid. Data URIs keep the whole thing one CSS
// background string: no network fetch, no extra DOM, nothing for the avatar to load.
//
// Tile size is set by the *smallest* surface, not the largest: in a mini fleet row
// the gradient box is ~91x38 and its mask hides everything left of ~27px, leaving a
// 64x38 window. Tiles have to be dense enough that a couple of petals land inside
// that, or sr3 looks identical to sr2 where it is seen most often.
//
// Transform order is translate -> scale -> rotate, so a motif's box stays at
// (x, y)..(x + 24s, y + 24s) and placements remain predictable; rotating last around
// the motif's own centre only spills a few px past that.
//
// Two motifs: a sakura petal, and a five-pointed star for non-Japanese ships.
// Both are drawn in the same 24x24 box so the tile layouts are interchangeable.
const PETAL = 'M12 1C5 7 3 15 7 22L12 18L17 22C21 15 19 7 12 1Z'
const STAR =
  'M12 1L14.7 8.3L22.5 8.6L16.4 13.4L18.5 20.9L12 16.6L5.5 20.9L7.6 13.4L1.5 8.6L9.3 8.3Z'

const motifTile = (
  motif: string,
  size: number,
  fill: string,
  items: [transform: string, opacity: string][],
) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'%3E%3Cg fill='%23${fill}'%3E${items
    .map(
      ([transform, opacity]) =>
        `%3Cpath d='${motif}' transform='${transform}' opacity='${opacity}'/%3E`,
    )
    .join('')}%3C/g%3E%3C/svg%3E")`

// Same placements for both motifs, so density and scatter stay identical.
const NEAR_LAYOUT: [string, string][] = [
  ['translate(3 5) scale(.62) rotate(22 12 12)', '.92'],
  ['translate(41 3) scale(.5) rotate(-38 12 12)', '.8'],
  ['translate(20 38) scale(.58) rotate(124 12 12)', '.86'],
]
const FAR_LAYOUT: [string, string][] = [
  ['translate(58 18) scale(.45) rotate(-52 12 12)', '.8'],
  ['translate(10 50) scale(.52) rotate(28 12 12)', '.85'],
  ['translate(72 66) scale(.4) rotate(98 12 12)', '.68'],
]

const sakuraNear = motifTile(PETAL, 68, 'ffdde8', NEAR_LAYOUT)
const sakuraFar = motifTile(PETAL, 95, 'fff0f4', FAR_LAYOUT)
// Stars read as metallic rather than blossom-pink, so they take a cooler cream.
const starNear = motifTile(STAR, 68, 'fff3d6', NEAR_LAYOUT)
const starFar = motifTile(STAR, 95, 'fffaf0', FAR_LAYOUT)

// Motif layers need a per-layer size, which the `background` shorthand only accepts
// as `<image> <position> / <size>` — so they are written that way rather than as a
// separate background-size, keeping the single-string contract these constants have.
const withMotif = (near: string, far: string) => `
  ${near} 0 0 / 68px 68px,
  ${far} 21px 13px / 95px 95px,
  ${vividRainbow.trim()}
`
const vividRainbowSakura = withMotif(sakuraNear, sakuraFar)
const vividRainbowStars = withMotif(starNear, starFar)

// Indexed by the `rank` lookup in ship-img.ts: ['', c1, c2, c3, r1, r2, sr1, sr2, sr3]
export const shipRankBackgrounds = [
  'linear-gradient(135deg, #eef4ff99 0%, #bcdcfa99 45%, #6fa8e099 100%)',
  'linear-gradient(135deg, #eef4ff99 0%, #bcdcfa99 45%, #6fa8e099 100%)',
  'linear-gradient(135deg, #dceaff99 0%, #a8cdf799 45%, #4f8fdb99 100%)',
  'linear-gradient(135deg, #e8fdfc99 0%, #b7f0ef99 45%, #5fcbd099 100%)',
  'linear-gradient(135deg, #f4f4f499 0%, #bdbdbd99 45%, #6e6e6e99 100%)',
  'linear-gradient(135deg, #6b541499 0%, #b8922e99 45%, #f4dd8299 100%)',
  softRainbow,
  vividRainbow,
  vividRainbowSakura,
]

// Indexed by the `itemrank` lookup in ship-img.ts: [item_c1, item_r1, sr1, sr1, sr1, sr2]
// Note `itemrank` tops out at sr2, so equipment never gets the sr3 petals.
export const equipRankBackgrounds = [
  'linear-gradient(135deg, #ffffff99 0%, #e7e3da99 45%, #c7c0b099 100%)',
  'linear-gradient(135deg, #f4f9f899 0%, #d3e3e299 45%, #a9c5c399 100%)',
  softRainbow,
  softRainbow,
  softRainbow,
  vividRainbow,
]

/**
 * Non-Japanese ships get the star motif rather than sakura.
 *
 * Detected from the name rather than a ship-class table: foreign ships are named in
 * Latin or Cyrillic script (Гангут, Верный) and Japanese ones never are, so this
 * needs no list kept up to date as ships are added. The ships it does call Japanese
 * despite foreign origin — 呂500 (ex U-511), 伊504 (ex Luigi Torelli) — were renamed
 * because they served in the IJN, so sakura is arguably right for them anyway.
 */
export const isForeignShip = ($ship: APIMstShip | undefined): boolean =>
  /[A-Za-zЀ-ӿ]/.test($ship?.api_name ?? '')

export function getShipAvatarBGByRarity(rank: number, foreign = false): string {
  if (foreign && rank === 8) return vividRainbowStars
  return shipRankBackgrounds[rank] ?? shipRankBackgrounds[0]
}

export function getEquipAvatarBGByRarity(rank: number): string {
  return equipRankBackgrounds[rank] ?? equipRankBackgrounds[0]
}

export function selectShipAvatarColor(
  ship: APIShip | undefined,
  $ship: APIMstShip | undefined,
  color: string[],
  opt: string,
): string {
  switch (opt) {
    case 'shiptype':
      return getShipAvatarColorByType($ship?.api_stype ?? 0)
    case 'range':
      return getShipAvatarColorByRange(ship?.api_leng ?? 0)
    case 'tag':
      return getShipAvatarColorByTag(ship?.api_sally_area ?? 0, color)
    case 'speed':
      return getShipAvatarColorBySpeed(ship?.api_soku ?? 0)
    case 'rarity':
      return getShipAvatarBGByRarity($ship?.api_backs ?? 7, isForeignShip($ship))
    default:
      return '#00000000'
  }
}

export const getSpeedLabel = (speed: number): string => speedInterpretation[speed] || 'Unknown'

export const getSpeedStyle = (speed: number): React.CSSProperties => speedStyles[speed] || {}

export enum ShipLabelStatus {
  Retreated = 'Retreated',
  Repairing = 'Repairing',
  ResupplyNeeded = 'ResupplyNeeded',
  ShipTag = 'ShipTag',
}

export interface ShipLabel {
  status: ShipLabelStatus
  /** `api_sally_area`, only set for `ShipLabelStatus.ShipTag` */
  sallyArea?: number
}

const DIMMED_STATUSES = [ShipLabelStatus.Retreated, ShipLabelStatus.Repairing]

export function getStatusStyle(labels: ShipLabel[] | null | undefined): React.CSSProperties {
  if (labels?.some(({ status }) => DIMMED_STATUSES.includes(status))) {
    return { opacity: 0.4 }
  }
  return {}
}

// NOTE: order matters, the first label decides the icon / intent shown on the tag.
export function getShipLabelStatus(
  ship: APIShip | undefined,
  $ship: APIMstShip | undefined,
  inRepair: boolean,
  escaped: boolean,
): ShipLabel[] {
  if (!ship || !$ship) {
    return []
  }
  const labels: ShipLabel[] = []
  if (escaped) {
    labels.push({ status: ShipLabelStatus.Retreated })
  }
  if (inRepair) {
    labels.push({ status: ShipLabelStatus.Repairing })
  }
  if (
    Math.min(ship.api_fuel / ($ship.api_fuel_max ?? 1), ship.api_bull / ($ship.api_bull_max ?? 1)) <
    1
  ) {
    labels.push({ status: ShipLabelStatus.ResupplyNeeded })
  }
  const sallyArea = ship.api_sally_area ?? 0
  if (sallyArea > 0) {
    labels.push({ status: ShipLabelStatus.ShipTag, sallyArea })
  }
  return labels
}

export function getHpStyle(percent: number): MaterialIntent {
  if (percent <= 25) {
    return 'red'
  } else if (percent <= 50) {
    return 'orange'
  } else if (percent <= 75) {
    return 'yellow'
  } else {
    return 'green'
  }
}

export function equipIsAircraft(equip: APIMstSlotitem | number): boolean {
  if (typeof equip === 'number') {
    return (
      equip != null &&
      (between(equip, 6, 10) ||
        between(equip, 21, 22) ||
        between(equip, 37, 40) ||
        between(equip, 43, 51) ||
        [33, 56].includes(equip))
    )
  } else {
    const id = equip?.api_type?.[2]
    return (
      between(id, 6, 11) ||
      between(id, 25, 26) ||
      between(id, 47, 48) ||
      between(id, 56, 59) ||
      [41, 45, 94].includes(id)
    )
  }
}

export function getTyku(
  // slots are padded with undefined when empty, see shipEquipDataSelectorFactory
  equipsData: ([Equip, APIMstSlotitem, number | undefined] | undefined)[][],
  landbaseStatus = 0,
): { basic: number; min: number; max: number } {
  let minTyku = 0
  let maxTyku = 0
  let basicTyku = 0
  let reconBonus = 1
  for (let i = 0; i < equipsData.length; i++) {
    if (!equipsData[i]) {
      continue
    }
    for (let j = 0; j < equipsData[i].length; j++) {
      const equipData = equipsData[i][j]
      if (!equipData) {
        continue
      }
      const [_equip, $equip, onslot] = equipData
      if ((onslot ?? 0) < 1 || onslot == undefined) {
        continue
      }
      let tempTyku = 0.0
      let tempAlv
      if (_equip.api_alv) {
        tempAlv = _equip.api_alv
      } else {
        tempAlv = 0
      }
      const levelFactor = $equip.api_tyku > 3 ? ($equip.api_baku > 0 ? 0.25 : 0.2) : 0
      if (
        [6, 7, 45, 47, 57].includes($equip.api_type[2]) ||
        ([26].includes($equip.api_type[2]) && $equip.api_tyku > 0)
      ) {
        tempTyku += Math.sqrt(onslot) * ($equip.api_tyku + (_equip.api_level || 0) * levelFactor)
        tempTyku += aircraftLevelBonus[$equip.api_type[2]][tempAlv]
        basicTyku += Math.floor(Math.sqrt(onslot) * $equip.api_tyku)
        minTyku += Math.floor(tempTyku + Math.sqrt(aircraftExpTable[tempAlv] / 10))
        maxTyku += Math.floor(tempTyku + Math.sqrt((aircraftExpTable[tempAlv + 1] - 1) / 10))
      } else if ([8, 11].includes($equip.api_type[2])) {
        tempTyku += Math.sqrt(onslot) * $equip.api_tyku
        tempTyku += aircraftLevelBonus[$equip.api_type[2]][tempAlv]
        basicTyku += Math.floor(Math.sqrt(onslot) * $equip.api_tyku)
        minTyku += Math.floor(tempTyku + Math.sqrt(aircraftExpTable[tempAlv] / 10))
        maxTyku += Math.floor(tempTyku + Math.sqrt((aircraftExpTable[tempAlv + 1] - 1) / 10))
      } else if ([48].includes($equip.api_type[2])) {
        let landbaseBonus = 0
        if (landbaseStatus === 1) landbaseBonus = 1.5 * $equip.api_houk
        if (landbaseStatus === 2) landbaseBonus = $equip.api_houk + 2 * $equip.api_houm
        tempTyku +=
          Math.sqrt(onslot) *
          ($equip.api_tyku + landbaseBonus + (_equip.api_level || 0) * levelFactor)
        tempTyku += aircraftLevelBonus[$equip.api_type[2]][tempAlv]
        basicTyku += Math.floor(Math.sqrt(onslot) * $equip.api_tyku)
        minTyku += Math.floor(tempTyku + Math.sqrt(aircraftExpTable[tempAlv] / 10))
        maxTyku += Math.floor(tempTyku + Math.sqrt((aircraftExpTable[tempAlv + 1] - 1) / 10))
      } else if ([10, 41].includes($equip.api_type[2])) {
        if (landbaseStatus == 2) {
          if ($equip.api_saku >= 9) {
            reconBonus = Math.max(reconBonus, 1.16)
          } else if ($equip.api_saku == 8) {
            reconBonus = Math.max(reconBonus, 1.13)
          } else {
            reconBonus = Math.max(reconBonus, 1.1)
          }
        } else if (landbaseStatus == 1) {
          tempTyku += Math.sqrt(onslot) * $equip.api_tyku
          minTyku += Math.floor(tempTyku + Math.sqrt(aircraftExpTable[tempAlv] / 10))
          maxTyku += Math.floor(tempTyku + Math.sqrt((aircraftExpTable[tempAlv + 1] - 1) / 10))
        }
      } else if ([9].includes($equip.api_type[2]) && landbaseStatus == 2) {
        if ($equip.api_saku >= 9) {
          reconBonus = Math.max(reconBonus, 1.3)
        } else {
          reconBonus = Math.max(reconBonus, 1.2)
        }
      } else if ([49].includes($equip.api_type[2])) {
        if (landbaseStatus == 1) {
          tempTyku += Math.sqrt(onslot) * ($equip.api_tyku + (_equip.api_level || 0) * levelFactor)
          basicTyku += Math.floor(Math.sqrt(onslot) * $equip.api_tyku)
          minTyku += Math.floor(tempTyku + Math.sqrt(aircraftExpTable[tempAlv] / 10))
          maxTyku += Math.floor(tempTyku + Math.sqrt((aircraftExpTable[tempAlv + 1] - 1) / 10))
          if ($equip.api_saku >= 9) {
            reconBonus = Math.max(reconBonus, 1.18)
          } else {
            reconBonus = Math.max(reconBonus, 1.15)
          }
        } else if (landbaseStatus == 2) {
          if ($equip.api_saku >= 9) {
            reconBonus = Math.max(reconBonus, 1.23)
          } else {
            reconBonus = Math.max(reconBonus, 1.18)
          }
        }
      }
    }
  }
  return {
    basic: Math.floor(basicTyku * reconBonus),
    min: Math.floor(minTyku * reconBonus),
    max: Math.floor(maxTyku * reconBonus),
  }
}

export function getSaku25(
  shipsData: [APIShip, APIMstShip][],
  // slots are padded with undefined when empty, see shipEquipDataSelectorFactory
  equipsData: ([Equip, APIMstSlotitem, number | undefined] | undefined)[][],
): { recon: number; radar: number; ship: number; total: number } {
  let reconSaku = 0
  let shipSaku = 0
  let radarSaku = 0
  for (let i = 0; i < equipsData.length; i++) {
    if (!shipsData[i] || !equipsData[i]) continue
    const [_ship] = shipsData[i]
    shipSaku += _ship.api_sakuteki[0]
    for (let j = 0; j < equipsData[i].length; j++) {
      const equipData = equipsData[i][j]
      if (!equipData) {
        continue
      }
      const $equip = equipData[1]
      switch ($equip.api_type[3]) {
        case 9:
          reconSaku += $equip.api_saku
          shipSaku -= $equip.api_saku
          break
        case 10:
          if ($equip.api_type[2] == 10) {
            reconSaku += $equip.api_saku
            shipSaku -= $equip.api_saku
          }
          break
        case 11:
          radarSaku += $equip.api_saku
          shipSaku -= $equip.api_saku
          break
        default:
          break
      }
    }
  }
  reconSaku = reconSaku * 2.0
  shipSaku = Math.sqrt(shipSaku)
  const totalSaku = reconSaku + radarSaku + shipSaku

  return {
    recon: parseFloat(reconSaku.toFixed(2)),
    radar: parseFloat(radarSaku.toFixed(2)),
    ship: parseFloat(shipSaku.toFixed(2)),
    total: parseFloat(totalSaku.toFixed(2)),
  }
}

export function getSaku25a(
  shipsData: [APIShip, APIMstShip][],
  // slots are padded with undefined when empty, see shipEquipDataSelectorFactory
  equipsData: ([Equip, APIMstSlotitem, number | undefined] | undefined)[][],
  teitokuLv: number,
): { ship: number; item: number; teitoku: number; total: number } {
  let shipSaku = 0
  let equipSaku = 0
  for (let i = 0; i < equipsData.length; i++) {
    if (!shipsData[i] || !equipsData[i]) continue
    const [_ship] = shipsData[i]
    let shipPureSaku = _ship.api_sakuteki[0]
    for (let j = 0; j < equipsData[i].length; j++) {
      const equipData = equipsData[i][j]
      if (!equipData) {
        continue
      }
      const $equip = equipData[1]
      shipPureSaku -= $equip.api_saku
      switch ($equip.api_type[3]) {
        case 7:
          equipSaku += $equip.api_saku * 1.04
          break
        case 8:
          equipSaku += $equip.api_saku * 1.37
          break
        case 9:
          equipSaku += $equip.api_saku * 1.66
          break
        case 10:
          if ($equip.api_type[2] == 10) {
            equipSaku += $equip.api_saku * 2.0
          } else if ($equip.api_type[2] == 11) {
            equipSaku += $equip.api_saku * 1.78
          }
          break
        case 11:
          if ($equip.api_type[2] == 12) {
            equipSaku += $equip.api_saku * 1.0
          } else if ($equip.api_type[2] == 13) {
            equipSaku += $equip.api_saku * 0.99
          }
          break
        case 24:
          equipSaku += $equip.api_saku * 0.91
          break
        default:
          break
      }
    }
    shipSaku += Math.sqrt(shipPureSaku) * 1.69
  }
  const teitokuSaku = 0.61 * Math.floor((teitokuLv + 4) / 5) * 5
  const totalSaku = shipSaku + equipSaku - teitokuSaku

  return {
    ship: parseFloat(shipSaku.toFixed(2)),
    item: parseFloat(equipSaku.toFixed(2)),
    teitoku: parseFloat(teitokuSaku.toFixed(2)),
    total: parseFloat(totalSaku.toFixed(2)),
  }
}

export function getSaku33(
  shipsData: [APIShip, APIMstShip][],
  // slots are padded with undefined when empty, see shipEquipDataSelectorFactory
  equipsData: ([Equip, APIMstSlotitem, number | undefined] | undefined)[][],
  teitokuLv: number,
  mapModifier = 1.0,
  slotCount = 6,
): { ship: number; item: number; teitoku: number; total: number } {
  let shipSaku = 0
  let equipSaku = 0
  let emptySlot = slotCount
  for (let i = 0; i < equipsData.length; i++) {
    if (!shipsData[i] || !equipsData[i]) continue
    emptySlot -= 1
    const [_ship] = shipsData[i]
    let shipPureSaku = _ship.api_sakuteki[0]
    for (let j = 0; j < equipsData[i].length; j++) {
      const equipData = equipsData[i][j]
      if (!equipData) {
        continue
      }
      const [_equip, $equip] = equipData
      shipPureSaku -= $equip.api_saku
      switch ($equip.api_type[2]) {
        case 8:
          equipSaku += $equip.api_saku * 0.8
          break
        case 9:
          equipSaku += $equip.api_saku * 1.0
          break
        case 10:
          equipSaku += ($equip.api_saku + 1.2 * Math.sqrt(_equip.api_level || 0)) * 1.2
          break
        case 11:
          equipSaku += ($equip.api_saku + 1.15 * Math.sqrt(_equip.api_level || 0)) * 1.1
          break
        case 12:
          equipSaku += ($equip.api_saku + 1.25 * Math.sqrt(_equip.api_level || 0)) * 0.6
          break
        case 13:
          equipSaku += ($equip.api_saku + 1.25 * Math.sqrt(_equip.api_level || 0)) * 0.6
          break
        default:
          equipSaku += $equip.api_saku * 0.6
          break
      }
    }
    shipSaku += Math.sqrt(shipPureSaku)
  }
  equipSaku *= mapModifier
  const teitokuSaku = Math.ceil(teitokuLv * 0.4)
  const totalSaku = shipSaku + equipSaku - teitokuSaku + 2 * emptySlot

  return {
    ship: parseFloat(shipSaku.toFixed(2)),
    item: parseFloat(equipSaku.toFixed(2)),
    teitoku: parseFloat(teitokuSaku.toFixed(2)),
    total: parseFloat(totalSaku.toFixed(2)),
  }
}

export const getFleetSpeed = (shipsData: [APIShip, APIMstShip][]): { speed: number } => ({
  speed:
    _(shipsData)
      .map(([ship = {}]) => ship.api_soku || Infinity)
      .min() || 0,
})

interface ElectronWebviewElement extends HTMLElement {
  getURL(): string
  executeJavaScript(code: string): Promise<unknown>
}

export async function isInGame(): Promise<boolean> {
  try {
    const webview = document.querySelector('webview') as ElectronWebviewElement | null
    if (webview?.getURL() === 'https://play.games.dmm.com/game/kancolle') {
      return true
    }
    const exists =
      (await webview?.executeJavaScript("document.querySelector('embed') !== null")) ?? false
    return Boolean(exists)
  } catch (_) {
    return false
  }
}

export const getSlotitemCount = (slotitems: EquipsState): number => {
  return Object.values(slotitems).filter(
    ({ api_slotitem_id }) => !uncountedSlotitemId.includes(api_slotitem_id),
  ).length
}

export const FLEET_INTENTS = [
  Intent.SUCCESS,
  Intent.WARNING,
  Intent.DANGER,
  Intent.NONE,
  Intent.PRIMARY,
  Intent.NONE,
]

export const getFleetIntent = (state: number, disabled: boolean): Intent =>
  state >= 0 && state <= 5 && !disabled ? FLEET_INTENTS[state] : Intent.NONE

export const DEFAULT_FLEET_NAMES = ['I', 'II', 'III', 'IV']

export const LBAC_INTENTS = [
  Intent.NONE,
  Intent.DANGER,
  Intent.WARNING,
  Intent.PRIMARY,
  Intent.SUCCESS,
]

export const LBAC_STATUS_NAMES = ['Standby', 'Sortie', 'Defense', 'Retreat', 'Rest']

export const LBAC_STATUS_AVATAR_COLOR = [
  shipAvatarColor.WHITE,
  shipAvatarColor.RED,
  shipAvatarColor.ORANGE,
  shipAvatarColor.BLUE,
  shipAvatarColor.GREEN,
]
