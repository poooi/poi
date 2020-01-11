import _ from 'lodash'

const isFullFleet = shipsData => shipsData.length >= 6

const overShip = n => func => shipsData => func(shipsData[n])

const overShipState = func => ship => func(ship[0])

const overShipProp = func => ship => func(ship[1])

const shipIdIs = n => overShipState(ship => ship.api_ship_id === n)

const isNotLightDmg = overShipState(ship => ship.api_nowhp * 4 > ship.api_maxhp * 3)

const isNotMidDmg = overShipState(ship => ship.api_nowhp * 2 > ship.api_maxhp)

// Not sure if nagato / mutsu sp attack requires 2nd ship is not heavy damaged
// const isNotHeavyDmg = overShipState(ship => ship.api_nowhp * 4 > ship.api_maxhp)

const isNotSub = overShipProp(ship => ship.api_stype !== 13 && ship.api_stype !== 14)

const isNotCarrier = overShipProp(
  ship => ship.api_stype !== 7 && ship.api_stype !== 11 && ship.api_stype !== 18,
)

const isBattleShip = overShipProp(
  ship =>
    ship.api_stype === 8 || ship.api_stype === 9 || ship.api_stype === 10 || ship.api_stype === 12,
)

const isNagatoKaiNi = shipIdIs(541)

const isMutsuKaiNi = shipIdIs(573)

const isNelson = _.overSome([shipIdIs(571), shipIdIs(576)])

const isColorado = _.overSome([shipIdIs(601), shipIdIs(1496)])

const isNelsonSpAttack = _.overEvery([
  isFullFleet,
  overShip(0)(_.overEvery([isNelson, isNotMidDmg])),
  overShip(1)(isNotSub),
  overShip(2)(_.overEvery([isNotSub, isNotCarrier])),
  overShip(3)(isNotSub),
  overShip(4)(_.overEvery([isNotSub, isNotCarrier])),
  overShip(5)(isNotSub),
])

const isNagatoSpAttack = _.overEvery([
  isFullFleet,
  overShip(0)(_.overEvery([isNagatoKaiNi, isNotMidDmg])),
  overShip(1)(isBattleShip),
  overShip(3)(isNotSub),
  overShip(3)(isNotSub),
  overShip(3)(isNotSub),
  overShip(5)(isNotSub),
])

const isMutsuSpAttack = _.overEvery([
  isFullFleet,
  overShip(0)(_.overEvery([isMutsuKaiNi, isNotMidDmg])),
  overShip(1)(isBattleShip),
  overShip(3)(isNotSub),
  overShip(3)(isNotSub),
  overShip(3)(isNotSub),
  overShip(5)(isNotSub),
])

const isColoradoSpAttack = _.overEvery([
  isFullFleet,
  overShip(0)(_.overEvery([isColorado, isNotLightDmg])),
  overShip(1)(_.overEvery([isBattleShip, isNotLightDmg])),
  overShip(2)(_.overEvery([isBattleShip, isNotLightDmg])),
  overShip(3)(isNotSub),
  overShip(4)(isNotSub),
  overShip(5)(isNotSub),
])

export const isSpAttack = _.overSome([
  isNelsonSpAttack,
  isNagatoSpAttack,
  isMutsuSpAttack,
  isColoradoSpAttack,
])
