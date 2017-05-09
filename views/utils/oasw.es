const iconIs = n => equip => equip.api_type[3] === n
const shipIdIs = n => ship => ship.api_ship_id === n
const hasSome = pred => xs => xs.some(pred)

const isSonar = iconIs(18)
const isIsuzuK2 = shipIdIs(141)
const taisenAbove = value => ship => ship.api_taisen[0] >= value
const isPF = ship => ship.api_stype === 1
const isCVL = ship => ship.api_stype === 7

export const isOASW = (ship, equips) =>
  isIsuzuK2(ship) ||
  (isPF(ship) && taisenAbove(60)(ship) && hasSome(isSonar)(equips)) ||
  (isCVL(ship) && taisenAbove(65)(ship)) ||
  (taisenAbove(100)(ship) && hasSome(isSonar)(equips))
