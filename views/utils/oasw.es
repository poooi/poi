const iconIs = n => equip => equip.api_type[3] === n
const shipIdIs = n => ship => ship.api_ship_id === n
const hasSome = pred => xs => xs.some(pred)

const isSonar = iconIs(18)
const isIsuzuK2 = shipIdIs(141)
const is931 = equip => equip.api_slotitem_id === 82 || equip.api_slotitem_id === 83
const taisenAbove = value => ship => ship.api_taisen[0] >= value
const isPF = ship => ship.api_stype === 1
const isTaiyou = ship => ship.api_ship_id === 526
const isTaiyouKai = ship => ship.api_ship_id === 380 || ship.api_ship_id === 529

export const isOASW = (ship, equips) =>
  isIsuzuK2(ship) ||
  (isPF(ship) && taisenAbove(60)(ship) && hasSome(isSonar)(equips)) ||
  (isTaiyou(ship) && taisenAbove(65)(ship) && hasSome(is931)(equips)) ||
  (isTaiyouKai(ship) && taisenAbove(65)(ship)) ||
  (taisenAbove(100)(ship) && hasSome(isSonar)(equips))
