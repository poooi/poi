import type { APIShip } from 'kcsapi/api_port/port/response'
import type { APIMstShip, APIMstSlotitem } from 'kcsapi/api_start2/getData/response'
import type { Equip, EquipsState } from 'views/redux/info/equips'

import { Intent } from '@blueprintjs/core'
import _ from 'lodash'

import { shipAvatarColor } from './color'
import { between } from './tools'

const aircraftExpTable = [0, 10, 25, 40, 55, 70, 85, 100, 121]
const MAX_AIRCRAFT_LEVEL = 7

const FIGHTER_PROFICIENCY = [0, 0, 2, 5, 9, 14, 14, 22, 22]
const BOMBER_PROFICIENCY = [0, 0, 0, 0, 0, 0, 0, 0, 0]

/** 制空値の熟練度ボーナス, keyed by equipment category (`api_type[2]`). */
const aircraftLevelBonus: Record<number, number[]> = {
  6: FIGHTER_PROFICIENCY, // 艦上戦闘機
  7: BOMBER_PROFICIENCY, // 艦上爆撃機
  8: BOMBER_PROFICIENCY, // 艦上攻撃機
  11: [0, 1, 1, 1, 1, 3, 3, 6, 6], // 水上爆撃機
  26: FIGHTER_PROFICIENCY, // 対潜哨戒機 (the 陸軍戦闘機 carried by escort carriers)
  45: FIGHTER_PROFICIENCY, // 水上戦闘機
  47: BOMBER_PROFICIENCY, // 陸上攻撃機
  48: FIGHTER_PROFICIENCY, // 局地戦闘機
  53: BOMBER_PROFICIENCY, // 大型陸上機
  // 56: 噴式戦闘機. It is a fighter, so it takes the same proficiency air power
  // bonus as 艦戦/水戦/局戦 rather than the bomber-like zeroes of the other jets.
  56: FIGHTER_PROFICIENCY,
  57: BOMBER_PROFICIENCY, // 噴式戦闘爆撃機
  58: BOMBER_PROFICIENCY, // 噴式攻撃機
}

/** Categories whose 対空 counts towards fighter power wherever they are equipped. */
const airPowerTypes = [6, 7, 8, 11, 26, 45, 47, 48, 53, 56, 57, 58]

/**
 * 偵察機. They never contribute on a fleet, but on a land base they add their own
 * 対空 *and* multiply the whole air corps' fighter power. 艦上偵察機 (9) cannot be
 * deployed to a land base, so only its multiplier is ever reachable.
 */
const reconTypes = [9, 10, 41, 49]

/**
 * ★ improvement bonus to 対空, by category — what improving a plane adds to 制空値.
 * wikiwiki 改修工廠 gives 艦戦・水戦・陸戦 ★×0.2 and 陸攻・大型陸上機 0.5×√★;
 * 陸上偵察機 and 大型飛行艇 are confirmed to gain 制空値 but "改修強化値の正確な式は
 * 不明", so those two carry the values kc-web and KC3Kai measured.
 * https://wikiwiki.jp/kancolle/%E6%94%B9%E4%BF%AE%E5%B7%A5%E5%BB%A0
 */
const improvementAAFactor: Record<number, number> = {
  6: 0.2, // 艦上戦闘機
  41: 0.15, // 大型飛行艇 — provisional
  45: 0.2, // 水上戦闘機
  47: 0.5, // 陸上攻撃機
  48: 0.2, // 局地戦闘機
  49: 0.2, // 陸上偵察機 — provisional
  53: 0.5, // 大型陸上機
  56: 0.2, // 噴式戦闘機 — improves like the fighter it is, once it becomes improvable
}

/** The two categories that scale with √★ rather than ★. */
const sqrtImprovementTypes = [47, 53]

/** "★×0.3：零式艦戦64型(制空戦闘機仕様)・零式艦戦64型(熟練爆戦)" — a line of its own. */
const improvementAAFactorById: Record<number, number> = {
  486: 0.3,
  487: 0.3,
}

/**
 * 爆戦 — 艦上爆撃機 that gain 対空 like a fighter, ★×0.25. wikiwiki names them one
 * by one rather than giving a 対空 threshold, since 彗星一二型(六三四空/三号爆弾
 * 搭載機) and Re.2001 CB改 carry a fighter's 対空 yet improve as plain 艦爆.
 * 零式艦戦64型(熟練爆戦) is listed with the ★×0.3 planes above instead.
 */
const fighterBomberIds = [
  60, // 零式艦戦62型(爆戦)
  154, // 零戦62型(爆戦/岩井隊)
  219, // 零式艦戦63型(爆戦)
  447, // 零式艦戦64型(複座KMX搭載機)
]

const getImprovementAABonus = ($equip: APIMstSlotitem, level: number): number => {
  if (!(level > 0)) return 0
  const byId = improvementAAFactorById[$equip.api_id]
  if (byId != null) return byId * level
  const type = $equip.api_type[2]
  const factor = improvementAAFactor[type]
  if (factor != null) {
    return factor * (sqrtImprovementTypes.includes(type) ? Math.sqrt(level) : level)
  }
  // "※艦攻、水爆、爆戦以外の艦爆は改修しても制空値は上昇しない" — everything left
  // improves attack power only, except the 爆戦 above.
  return fighterBomberIds.includes($equip.api_id) ? 0.25 * level : 0
}

/**
 * 局地戦闘機 spend their 迎撃 (`api_houk`) / 対爆 (`api_houm`) only on a land base.
 * 噴式戦闘機 reuses those two stat slots for plain 回避/命中, so it is left out.
 */
const getInterceptionBonus = ($equip: APIMstSlotitem, landbaseStatus: number): number => {
  if ($equip.api_type[2] !== 48) return 0
  if (landbaseStatus === 1) return 1.5 * $equip.api_houk
  if (landbaseStatus === 2) return $equip.api_houk + 2 * $equip.api_houm
  return 0
}

/** 偵察機の制空値倍率. Three 索敵 tiers: 7 or below, 8, and 9 or above. */
const getReconBonus = ($equip: APIMstSlotitem, landbaseStatus: number): number => {
  const tier = Math.min(Math.max($equip.api_saku - 7, 0), 2)
  const type = $equip.api_type[2]
  if (landbaseStatus === 1) {
    // 出撃: only 陸上偵察機 help
    return type === 49 ? 1.12 + tier * 0.03 : 1
  }
  if (landbaseStatus === 2) {
    if (type === 9) return 1.2 + tier * 0.05 // 艦上偵察機
    if (type === 10 || type === 41) return 1.1 + tier * 0.03 // 水上偵察機 / 大型飛行艇
    if (type === 49) return 1.12 + tier * 0.06 // 陸上偵察機
  }
  return 1
}

const countsTowardsAirPower = ($equip: APIMstSlotitem, landbaseStatus: number): boolean => {
  const type = $equip.api_type[2]
  // 三式指揮連絡機 and friends share the category with the 陸軍戦闘機 but have no 対空
  if (type === 26) return $equip.api_tyku > 0
  if (airPowerTypes.includes(type)) return true
  // 偵察機 only count on a land base, and 艦上偵察機 cannot be based on one
  return type !== 9 && reconTypes.includes(type) && (landbaseStatus === 1 || landbaseStatus === 2)
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
    // icon id (`api_type[3]`); 56-60 covers the later fighter/jet icons, up to
    // 60 (震電改三, the first 噴式戦闘機)
    return (
      equip != null &&
      (between(equip, 6, 10) ||
        between(equip, 21, 22) ||
        between(equip, 37, 40) ||
        between(equip, 43, 51) ||
        between(equip, 56, 60) ||
        equip === 33)
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
  for (const shipEquips of equipsData) {
    if (!shipEquips) {
      continue
    }
    for (const equipData of shipEquips) {
      if (!equipData) {
        continue
      }
      const [_equip, $equip, onslot] = equipData
      if (onslot == undefined || onslot < 1) {
        continue
      }
      const type = $equip.api_type[2]
      if (reconTypes.includes(type)) {
        reconBonus = Math.max(reconBonus, getReconBonus($equip, landbaseStatus))
      }
      if (!countsTowardsAirPower($equip, landbaseStatus)) {
        continue
      }
      const alv = Math.min(_equip.api_alv || 0, MAX_AIRCRAFT_LEVEL)
      const aa =
        $equip.api_tyku +
        getImprovementAABonus($equip, _equip.api_level || 0) +
        getInterceptionBonus($equip, landbaseStatus)
      const tyku = Math.sqrt(onslot) * aa + (aircraftLevelBonus[type]?.[alv] ?? 0)
      basicTyku += Math.floor(Math.sqrt(onslot) * $equip.api_tyku)
      minTyku += Math.floor(tyku + Math.sqrt(aircraftExpTable[alv] / 10))
      maxTyku += Math.floor(tyku + Math.sqrt((aircraftExpTable[alv + 1] - 1) / 10))
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
          equipSaku += ($equip.api_saku + 1.2 * Math.sqrt(_equip.api_level || 0)) * 1.0
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
          equipSaku += ($equip.api_saku + 1.4 * Math.sqrt(_equip.api_level || 0)) * 0.6
          break
        case 26:
          equipSaku += ($equip.api_saku + 1.0 * Math.sqrt(_equip.api_level || 0)) * 0.6
          break
        case 41:
          equipSaku += ($equip.api_saku + 1.2 * Math.sqrt(_equip.api_level || 0)) * 0.6
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

export function getCombinedSaku33(
  mainShipsData: [APIShip, APIMstShip][],
  mainEquipsData: ([Equip, APIMstSlotitem, number | undefined] | undefined)[][],
  escortShipsData: [APIShip, APIMstShip][],
  escortEquipsData: ([Equip, APIMstSlotitem, number | undefined] | undefined)[][],
  teitokuLv: number,
  mapModifier: number | undefined,
  mainSlotCount = 6,
  escortSlotCount = 6,
) {
  const mainSaku33 = getSaku33(mainShipsData, mainEquipsData, teitokuLv, mapModifier, mainSlotCount)
  const escortSaku33 = getSaku33(
    escortShipsData,
    escortEquipsData,
    teitokuLv,
    mapModifier,
    escortSlotCount,
  )
  return {
    ship: parseFloat((mainSaku33.ship + escortSaku33.ship).toFixed(2)),
    item: parseFloat((mainSaku33.item + escortSaku33.item).toFixed(2)),
    teitoku: parseFloat((mainSaku33.teitoku + escortSaku33.teitoku).toFixed(2)),
    total: parseFloat((mainSaku33.total + escortSaku33.total).toFixed(2)),
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

// What a fleet is busy with, as computed by `getDeckState`. The values are
// ordered: a fleet gets the highest state that applies to it, and states from
// `Repairing` up mean the fleet is not available for a sortie. Kept numeric
// (and in the original order) because plugins read these values.
export enum DeckState {
  /** Ready to sortie */
  Ready = 0,
  /** Tired, moderately damaged or not resupplied */
  Warning = 1,
  /** Badly fatigued or heavily damaged */
  Danger = 2,
  /** A member is in a repair dock */
  Repairing = 3,
  /** Away on an expedition */
  Expedition = 4,
  /** Sortied */
  Sortie = 5,
}

// A fleet in one of these states can't be sent out as it is
export const UNAVAILABLE_DECK_STATES = [DeckState.Repairing, DeckState.Expedition, DeckState.Sortie]

export const FLEET_INTENTS: Record<DeckState, Intent> = {
  [DeckState.Ready]: Intent.SUCCESS,
  [DeckState.Warning]: Intent.WARNING,
  [DeckState.Danger]: Intent.DANGER,
  [DeckState.Repairing]: Intent.NONE,
  [DeckState.Expedition]: Intent.PRIMARY,
  [DeckState.Sortie]: Intent.NONE,
}

export const getFleetIntent = (state: DeckState, disabled: boolean): Intent =>
  disabled ? Intent.NONE : (FLEET_INTENTS[state] ?? Intent.NONE)

export const DEFAULT_FLEET_NAMES = ['I', 'II', 'III', 'IV']

// `api_state` of a repair dock
export enum RepairDockState {
  /** Not unlocked yet */
  Locked = -1,
  Empty = 0,
  Repairing = 1,
}

// `api_state` of a construction dock
export enum ConstructionDockState {
  /** Not unlocked yet */
  Locked = -1,
  Empty = 0,
  Building = 2,
  /** Built, waiting to be collected */
  Completed = 3,
}

// `api_state` of a quest
export enum QuestState {
  Unselected = 1,
  InProgress = 2,
  Completed = 3,
}

// `api_progress_flag` of a quest: the coarse progress the game reports on top
// of `QuestState`, for quests whose exact counter it doesn't expose
export enum QuestProgressFlag {
  /** Under 50% */
  None = 0,
  /** 50% or more */
  Half = 1,
  /** 80% or more */
  Most = 2,
}

// `api_action_kind` of a land base: what its squadrons are ordered to do
export enum AirbaseActionKind {
  Standby = 0,
  Sortie = 1,
  Defense = 2,
  Retreat = 3,
  Rest = 4,
}

const AIRBASE_ACTION_KINDS = [
  AirbaseActionKind.Standby,
  AirbaseActionKind.Sortie,
  AirbaseActionKind.Defense,
  AirbaseActionKind.Retreat,
  AirbaseActionKind.Rest,
]

// the game only ever sends the kinds above, but the payloads are optional and
// partial in places, so narrow before indexing anything by the action kind
export const toAirbaseActionKind = (value: unknown): AirbaseActionKind =>
  AIRBASE_ACTION_KINDS.find((kind) => kind === value) ?? AirbaseActionKind.Standby

// A land base only takes part in a battle under these orders
export const AIRBASE_ACTING_KINDS = [AirbaseActionKind.Sortie, AirbaseActionKind.Defense]

// `api_state` of a squadron slot on a land base
export enum PlaneState {
  /** No plane assigned */
  Empty = 0,
  Ready = 1,
  /** Being moved to another base */
  Relocating = 2,
}

// `api_cond` of a squadron slot: its fatigue. Some responses send 0 for a slot
// that is in fact rested, so treat anything below `Tired` as `Normal`.
export enum PlaneCond {
  Normal = 1,
  Tired = 2,
  Fatigued = 3,
}

export const LBAC_INTENTS: Record<AirbaseActionKind, Intent> = {
  [AirbaseActionKind.Standby]: Intent.NONE,
  [AirbaseActionKind.Sortie]: Intent.DANGER,
  [AirbaseActionKind.Defense]: Intent.WARNING,
  [AirbaseActionKind.Retreat]: Intent.PRIMARY,
  [AirbaseActionKind.Rest]: Intent.SUCCESS,
}

export const LBAC_STATUS_NAMES: Record<AirbaseActionKind, string> = {
  [AirbaseActionKind.Standby]: 'Standby',
  [AirbaseActionKind.Sortie]: 'Sortie',
  [AirbaseActionKind.Defense]: 'Defense',
  [AirbaseActionKind.Retreat]: 'Retreat',
  [AirbaseActionKind.Rest]: 'Rest',
}

export const LBAC_STATUS_AVATAR_COLOR: Record<AirbaseActionKind, string> = {
  [AirbaseActionKind.Standby]: shipAvatarColor.WHITE,
  [AirbaseActionKind.Sortie]: shipAvatarColor.RED,
  [AirbaseActionKind.Defense]: shipAvatarColor.ORANGE,
  [AirbaseActionKind.Retreat]: shipAvatarColor.BLUE,
  [AirbaseActionKind.Rest]: shipAvatarColor.GREEN,
}
