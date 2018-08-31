import { countBy } from 'lodash'

const isAAGun = equip => equip.api_type[2] === 21
const isHighAngleMount = equip => equip.api_type[3] === 16
const isAAFireDirector = equip => equip.api_type[2] === 36
const isAARadar = equip => [12, 13].includes(equip.api_type[2]) && equip.api_tyku > 0

// 12cm30連装噴進砲改二
const isTubeRocketLauncherKai2 = equip => equip.api_slotitem_id === 274

// 6=航空巡洋艦 7=軽空母 10=航空戦艦 11=正規空母 16=水上機母艦 18=装甲空母
const canAAPB = ship => [6, 7, 10, 11, 16, 18].includes(ship.api_stype)

// 2=伊勢型
const isIseClass = ship => ship.api_ctype === 2

// 加重対空値
const getEquipWeightedAA = equip => {
  if (isAAGun(equip)) return equip.api_tyku * 6 + 4 * equip.api_level ** .5
  if (isHighAngleMount(equip)) return equip.api_tyku * 4 + 3 * equip.api_level ** .5
  if (isAAFireDirector(equip)) return equip.api_tyku * 4
  if (isAARadar(equip)) return equip.api_tyku * 3
  return 0
}

// 艦の素対空値
const getShipAA = (ship, equips) => ship.api_taiku[0] - equips.reduce((total, equip) => total + equip.api_tyku, 0)

export const getShipAAPB = (ship, equips) => {
  if (!canAAPB(ship)) return 0
  if (!equips.find(e => isTubeRocketLauncherKai2(e))) return 0

  const rocketCount = countBy(equips, isTubeRocketLauncherKai2).true
  const weightedAA = equips.reduce((total, equip) => total + getEquipWeightedAA(equip), 0) + getShipAA(ship, equips)

  let rate = isIseClass(ship) ? 25 : 0
  rate += (rocketCount - 1) * 15
  rate += (ship.api_lucky[0] + weightedAA) / 2.82
  return Math.min(rate, 100).toFixed(2)
}