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

// These mock the rarity background the game bakes into a ship's art. The
// reference is kcs2/resources/ship/supply_character/*.png — a 711x71 strip, the
// widest surface the game paints this artwork on and so the closest analogue to an
// avatar. A ship banner also bakes it in, but its crop is too small to show what
// the artwork is doing: read on its own it looks like vertical bands, which are
// really just one slice of a much larger shape.
//
// The commons are a near-flat colour with a slight ramp. The pastel tiers are a
// conic burst — colour radiates from a point, warm through one half and cool
// through the other, fanning through the whole hue circle where the two meet.
//
// They are drawn as a linear sweep rather than as that burst, though. An avatar is
// small and its overlay is masked in from the left, so only a wedge of a conic ever
// survives: at the centre the game puts, the visible wedge is the cool half alone,
// which reads as a flat blue-white, and the burst's one hard edge — where its warm
// and cool halves meet — lands in view. Walking the same measured ring left to
// right instead keeps every hue and puts that hard edge at the two ends, where it
// cannot be seen. The palette and its order are the artwork's; only the geometry is
// adapted to the space available.
//
// Measured, not eyeballed. Per api_backs tier, ~20 strips reduce to a per-pixel
// median, which keeps the shared background and rejects ship art. Art columns are
// then dropped by variance (the art carries fine vertical detail, the background is
// smooth top to bottom), and near-neutral pixels — the white gear overlays — are
// skipped since they carry no hue. The conic centre is fitted by scoring candidates
// on hue error against every remaining pixel. Angles are measured in normalised
// coordinates so the strip's 10:1 aspect isn't baked in, leaving CSS to re-apply
// whatever stretch the real element has.
//
// Colours are the median per angular bucket, rescaled by separating luma from
// chroma: luma remapped into a renderable band, chroma scaled to hit a budget. Hue
// is never interpolated, which matters — where the sweep crosses its pale
// near-neutral zone, interpolating hue invents a saturated green band that simply
// is not in the artwork.
//
// How colourful a layer ends up is chroma x its own alpha; the white base under it
// only moves lightness, so lowering that base cannot rescue a washed-out sweep. The
// commons take their budget straight from the source (its own chroma x our alpha)
// so each reads as saturated in-app as in game. The pastels are deliberately held
// above that: the real artwork is far paler than works behind a ship name.
//
// Every layer is semi-transparent so the theme background bleeds through — the
// tint darkens on dark themes and stays light on light themes, keeping text on
// top readable either way.
const softRainbow = `
  linear-gradient(
    to right,
    rgb(218 211 77 / 0.6) 0%,
    rgb(225 201 174 / 0.6) 13%,
    rgb(228 195 124 / 0.6) 25%,
    rgb(247 148 101 / 0.6) 38%,
    rgb(251 136 134 / 0.6) 50%,
    rgb(208 140 180 / 0.6) 63%,
    rgb(165 143 225 / 0.6) 75%,
    rgb(130 159 228 / 0.6) 88%,
    rgb(93 218 216 / 0.6) 100%
  ),
  rgb(252 252 250 / 0.32)
`
const vividRainbow = `
  radial-gradient(circle at 25% 20%, rgb(255 255 255 / 0.6) 0%, rgb(255 255 255 / 0) 8%),
  radial-gradient(circle at 75% 15%, rgb(255 255 255 / 0.6) 0%, rgb(255 255 255 / 0) 6%),
  radial-gradient(circle at 60% 70%, rgb(255 255 255 / 0.6) 0%, rgb(255 255 255 / 0) 6%),
  linear-gradient(
    to right,
    rgb(226 221 66 / 0.65) 0%,
    rgb(227 199 158 / 0.65) 13%,
    rgb(240 199 112 / 0.65) 25%,
    rgb(245 152 90 / 0.65) 38%,
    rgb(246 148 140 / 0.65) 50%,
    rgb(200 146 179 / 0.65) 63%,
    rgb(154 143 218 / 0.65) 75%,
    rgb(134 231 244 / 0.65) 88%,
    rgb(74 218 220 / 0.65) 100%
  ),
  rgb(251 250 246 / 0.35)
`
// sr3 measures as its own artwork rather than a reskin of sr2.
const radiantRainbow = `
  radial-gradient(circle at 25% 20%, rgb(255 255 255 / 0.6) 0%, rgb(255 255 255 / 0) 8%),
  radial-gradient(circle at 75% 15%, rgb(255 255 255 / 0.6) 0%, rgb(255 255 255 / 0) 6%),
  radial-gradient(circle at 60% 70%, rgb(255 255 255 / 0.6) 0%, rgb(255 255 255 / 0) 6%),
  linear-gradient(
    to right,
    rgb(216 216 62 / 0.65) 0%,
    rgb(221 195 152 / 0.65) 13%,
    rgb(235 207 119 / 0.65) 25%,
    rgb(240 153 89 / 0.65) 38%,
    rgb(244 147 126 / 0.65) 50%,
    rgb(197 146 172 / 0.65) 63%,
    rgb(149 146 218 / 0.65) 75%,
    rgb(137 221 237 / 0.65) 88%,
    rgb(67 216 201 / 0.65) 100%
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
// Transform order is translate -> scale -> rotate, so a petal's box stays at
// (x, y)..(x + 24s, y + 24s) and placements remain predictable; rotating last around
// the petal's own centre only spills a few px past that.
const PETAL = 'M12 1C5 7 3 15 7 22L12 18L17 22C21 15 19 7 12 1Z'

const petalTile = (size: number, fill: string, petals: [transform: string, opacity: string][]) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'%3E%3Cg fill='%23${fill}'%3E${petals
    .map(
      ([transform, opacity]) =>
        `%3Cpath d='${PETAL}' transform='${transform}' opacity='${opacity}'/%3E`,
    )
    .join('')}%3C/g%3E%3C/svg%3E")`

const sakuraNear = petalTile(68, 'ffdde8', [
  ['translate(3 5) scale(.62) rotate(22 12 12)', '.92'],
  ['translate(41 3) scale(.5) rotate(-38 12 12)', '.8'],
  ['translate(20 38) scale(.58) rotate(124 12 12)', '.86'],
])
const sakuraFar = petalTile(95, 'fff0f4', [
  ['translate(58 18) scale(.45) rotate(-52 12 12)', '.8'],
  ['translate(10 50) scale(.52) rotate(28 12 12)', '.85'],
  ['translate(72 66) scale(.4) rotate(98 12 12)', '.68'],
])

// Petal layers need a per-layer size, which the `background` shorthand only accepts
// as `<image> <position> / <size>` — so they are written that way rather than as a
// separate background-size, keeping the single-string contract these constants have.
const vividRainbowSakura = `
  ${sakuraNear} 0 0 / 68px 68px,
  ${sakuraFar} 21px 13px / 95px 95px,
  ${radiantRainbow.trim()}
`

const commonBlue = `linear-gradient(
    to right,
    rgb(171 191 235 / 0.6) 0%,
    rgb(167 187 232 / 0.6) 8%,
    rgb(127 153 207 / 0.6) 41%,
    rgb(126 152 207 / 0.6) 69%,
    rgb(129 155 209 / 0.6) 83%,
    rgb(126 152 207 / 0.6) 100%
  )`

// Indexed by the `rank` lookup in ship-img.ts: ['', c1, c2, c3, r1, r2, sr1, sr2, sr3].
// Index 0 never occurs in practice; it mirrors c1 so a bad lookup still renders.
export const shipRankBackgrounds = [
  commonBlue,
  commonBlue,
  `linear-gradient(
    to right,
    rgb(155 200 227 / 0.6) 0%,
    rgb(156 200 227 / 0.6) 7%,
    rgb(146 192 220 / 0.6) 15%,
    rgb(112 167 199 / 0.6) 36%,
    rgb(105 162 195 / 0.6) 42%,
    rgb(106 163 196 / 0.6) 69%,
    rgb(110 166 199 / 0.6) 83%,
    rgb(106 163 196 / 0.6) 100%
  )`,
  `linear-gradient(
    to right,
    rgb(137 205 213 / 0.6) 0%,
    rgb(134 199 207 / 0.6) 7%,
    rgb(127 192 200 / 0.6) 12%,
    rgb(92 172 183 / 0.6) 36%,
    rgb(86 169 180 / 0.6) 47%,
    rgb(86 169 180 / 0.6) 100%
  )`,
  `linear-gradient(
    to right,
    rgb(161 166 170 / 0.6) 0%,
    rgb(155 168 176 / 0.6) 36%,
    rgb(160 175 182 / 0.6) 41%,
    rgb(188 204 210 / 0.6) 53%,
    rgb(187 202 209 / 0.6) 58%,
    rgb(145 158 165 / 0.6) 75%,
    rgb(134 146 152 / 0.6) 100%
  )`,
  `linear-gradient(
    to right,
    rgb(194 166 111 / 0.6) 0%,
    rgb(191 164 107 / 0.6) 10%,
    rgb(194 166 71 / 0.6) 37%,
    rgb(212 197 61 / 0.6) 54%,
    rgb(205 188 60 / 0.6) 61%,
    rgb(183 152 55 / 0.6) 71%,
    rgb(173 137 53 / 0.6) 80%,
    rgb(167 127 51 / 0.6) 100%
  )`,
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

export function getShipAvatarBGByRarity(rank: number): string {
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
      return getShipAvatarBGByRarity($ship?.api_backs ?? 7)
    default:
      return '#00000000'
  }
}

export const getSpeedLabel = (speed: number): string => speedInterpretation[speed] || 'Unknown'

export const getSpeedStyle = (speed: number): React.CSSProperties => speedStyles[speed] || {}

export function getStatusStyle(status: number | null | undefined): React.CSSProperties {
  if (status != null) {
    const flag = status == 0 || status == 1
    if (flag) {
      return { opacity: 0.4 }
    }
  }
  return {}
}

export function getShipLabelStatus(
  ship: APIShip | undefined,
  $ship: APIMstShip | undefined,
  inRepair: boolean,
  escaped: boolean,
): number {
  if (!ship || !$ship) {
    return -1
  }
  if (escaped) {
    return 0
  } else if (inRepair) {
    return 1
  } else if (
    Math.min(ship.api_fuel / ($ship.api_fuel_max ?? 1), ship.api_bull / ($ship.api_bull_max ?? 1)) <
    1
  ) {
    return 2
  } else if ((ship.api_sally_area ?? 0) > 0) {
    return (ship.api_sally_area ?? 0) + 2
  }
  return -1
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
  equipsData: [Equip, APIMstSlotitem, number | undefined][][],
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
      if (!equipsData[i][j]) {
        continue
      }
      const [_equip, $equip, onslot] = equipsData[i][j]
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
  equipsData: [Equip, APIMstSlotitem, number | undefined][][],
): { recon: number; radar: number; ship: number; total: number } {
  let reconSaku = 0
  let shipSaku = 0
  let radarSaku = 0
  for (let i = 0; i < equipsData.length; i++) {
    if (!shipsData[i] || !equipsData[i]) continue
    const [_ship] = shipsData[i]
    shipSaku += _ship.api_sakuteki[0]
    for (let j = 0; j < equipsData[i].length; j++) {
      if (!equipsData[i][j]) {
        continue
      }
      const $equip = equipsData[i][j][1]
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
  equipsData: [Equip, APIMstSlotitem, number | undefined][][],
  teitokuLv: number,
): { ship: number; item: number; teitoku: number; total: number } {
  let shipSaku = 0
  let equipSaku = 0
  for (let i = 0; i < equipsData.length; i++) {
    if (!shipsData[i] || !equipsData[i]) continue
    const [_ship] = shipsData[i]
    let shipPureSaku = _ship.api_sakuteki[0]
    for (let j = 0; j < equipsData[i].length; j++) {
      if (!equipsData[i][j]) {
        continue
      }
      const $equip = equipsData[i][j][1]
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
  equipsData: [Equip, APIMstSlotitem, number | undefined][][],
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
      if (!equipsData[i][j]) {
        continue
      }
      const [_equip, $equip] = equipsData[i][j]
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
