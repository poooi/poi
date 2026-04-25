import { Intent } from '@blueprintjs/core'
import _, { get } from 'lodash'

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

export function getMaterialStyle(percent: number): string {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function selectShipAvatarColor(ship: any, $ship: any, color: string[], opt: string): string {
  switch (opt) {
    case 'shiptype':
      return getShipAvatarColorByType($ship.api_stype)
    case 'range':
      return getShipAvatarColorByRange(ship.api_leng)
    case 'tag':
      return getShipAvatarColorByTag(ship.api_sally_area, color)
    case 'speed':
      return getShipAvatarColorBySpeed(ship.api_soku)
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getShipLabelStatus(
  ship: any,
  $ship: any,
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
  } else if (Math.min(ship.api_fuel / $ship.api_fuel_max, ship.api_bull / $ship.api_bull_max) < 1) {
    return 2
  } else if (ship.api_sally_area > 0) {
    return ship.api_sally_area + 2
  }
  return -1
}

export function getHpStyle(percent: number): string {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function equipIsAircraft(equip: any): boolean {
  if (Number.isInteger(equip)) {
    return (
      equip != null &&
      (between(equip, 6, 10) ||
        between(equip, 21, 22) ||
        between(equip, 37, 40) ||
        between(equip, 43, 51) ||
        [33, 56].includes(equip))
    )
  } else {
    const id = get(equip, 'api_type.2', 0)
    return (
      between(id, 6, 11) ||
      between(id, 25, 26) ||
      between(id, 47, 48) ||
      between(id, 56, 59) ||
      [41, 45, 94].includes(id)
    )
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTyku(
  equipsData: any[][],
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
      if (onslot < 1 || onslot == undefined) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSaku25(
  shipsData: any[][],
  equipsData: any[][],
): { recon: number; radar: number; ship: number; total: number } {
  let reconSaku = 0
  let shipSaku = 0
  let radarSaku = 0
  let totalSaku = 0
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
  totalSaku = reconSaku + radarSaku + shipSaku

  return {
    recon: parseFloat(reconSaku.toFixed(2)),
    radar: parseFloat(radarSaku.toFixed(2)),
    ship: parseFloat(shipSaku.toFixed(2)),
    total: parseFloat(totalSaku.toFixed(2)),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSaku25a(
  shipsData: any[][],
  equipsData: any[][],
  teitokuLv: number,
): { ship: number; item: number; teitoku: number; total: number } {
  let totalSaku = 0
  let shipSaku = 0
  let equipSaku = 0
  let teitokuSaku = 0
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
  teitokuSaku = 0.61 * Math.floor((teitokuLv + 4) / 5) * 5
  totalSaku = shipSaku + equipSaku - teitokuSaku

  return {
    ship: parseFloat(shipSaku.toFixed(2)),
    item: parseFloat(equipSaku.toFixed(2)),
    teitoku: parseFloat(teitokuSaku.toFixed(2)),
    total: parseFloat(totalSaku.toFixed(2)),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSaku33(
  shipsData: any[][],
  equipsData: any[][],
  teitokuLv: number,
  mapModifier = 1.0,
  slotCount = 6,
): { ship: number; item: number; teitoku: number; total: number } {
  let totalSaku = 0
  let shipSaku = 0
  let equipSaku = 0
  let teitokuSaku = 0
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
  teitokuSaku = Math.ceil(teitokuLv * 0.4)
  totalSaku = shipSaku + equipSaku - teitokuSaku + 2 * emptySlot

  return {
    ship: parseFloat(shipSaku.toFixed(2)),
    item: parseFloat(equipSaku.toFixed(2)),
    teitoku: parseFloat(teitokuSaku.toFixed(2)),
    total: parseFloat(totalSaku.toFixed(2)),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getFleetSpeed = (shipsData: any[][]): { speed: number } => ({
  speed:
    _(shipsData)
      .map(([ship = {}] = []) => ship.api_soku || Infinity)
      .min() || 0,
})

interface ElectronWebviewElement extends HTMLElement {
  getURL(): string
  executeJavaScript(code: string): Promise<unknown>
}

export async function isInGame(): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSlotitemCount = (slotitems: Record<string, any>): number => {
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
