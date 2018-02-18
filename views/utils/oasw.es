import { equipIsAircraft } from './game-utils'

const iconIs = n => equip => equip.api_type[3] === n
const shipIdIs = n => ship => ship.api_ship_id === n
const hasSome = pred => xs => xs.some(pred)
const validAll = (...func) => x => func.every(f => f(x))

const isSonar = iconIs(18)
const isIsuzuK2 = shipIdIs(141)
const isAircraft = equip => equipIsAircraft(equip)
const is931 = equip => equip.api_slotitem_id === 82 || equip.api_slotitem_id === 83

const taisenAbove = value => ship => ship.api_taisen[0] >= value

const isPF = ship => ship.api_stype === 1
const isTaiyou = ship => ship.api_ship_id === 526
const isTaiyouKai = ship => ship.api_ship_id === 380 || ship.api_ship_id === 529

const map = f => xs => xs.map(x => f(x))
const sumAbove = value => xs => xs.reduce((s, x) => s + x, 0) >= value
const equipTais = equip => equip.api_tais || 0

export const isOASW = (ship, equips) => false
  || isIsuzuK2(ship)
  || (isPF(ship) && taisenAbove(60)(ship) && hasSome(isSonar)(equips))
  || (isPF(ship) && taisenAbove(75)(ship) && sumAbove(4)(map(equipTais)(equips)))
  || (isTaiyou(ship) && taisenAbove(65)(ship) && hasSome(is931)(equips))
  || (isTaiyouKai(ship) && taisenAbove(65)(ship) && hasSome(validAll(equipTais, isAircraft))(equips))
  || (taisenAbove(100)(ship) && hasSome(isSonar)(equips) && !(isTaiyou(ship) || isTaiyouKai(ship)))
