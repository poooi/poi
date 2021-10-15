import _ from 'lodash'

const overNotLessThan =
  (n) =>
  ([...funcs]) =>
  (...data) =>
    funcs.map((func) => func(...data)).filter((result) => result).length >= n

const isSpAttackNotUsed = (shipsData, extraData) => !extraData.spAttackUsed

const hasSubmarineSupply = (shipsData, extraData) => extraData.submarineSupplyCount > 0

const isNotInCombinedFleet = (shipsData, extraData) =>
  !extraData.combinedFlag || extraData.fleetId > 1

const hasShipMoreThan = (n) => (shipsData) => shipsData && shipsData.length >= n

const isFullFleet = hasShipMoreThan(6)

const isFleetWith5NonSubs = (shipsData) => shipsData && shipsData.filter(isNotSub).length >= 5

const overShip = (n) => (func) => (shipsData) => func(shipsData[n])

const overShipState = (func) => (ship) => func(ship[0])

const overShipProp = (func) => (ship) => func(ship[1])

const shipIdIs = (n) => overShipState((ship) => ship.api_ship_id === n)

const isNotLightDmg = overShipState((ship) => ship.api_nowhp * 4 > ship.api_maxhp * 3)

const isNotMidDmg = overShipState((ship) => ship.api_nowhp * 2 > ship.api_maxhp)

const isNotHeavyDmg = overShipState((ship) => ship.api_nowhp * 4 > ship.api_maxhp)

const isLevelOver = (level) => overShipState((ship) => ship.api_lv >= level)

const isNotSub = overShipProp((ship) => ship.api_stype !== 13 && ship.api_stype !== 14)

const isNotCarrier = overShipProp(
  (ship) => ship.api_stype !== 7 && ship.api_stype !== 11 && ship.api_stype !== 18,
)

const isBattleShip = overShipProp(
  (ship) =>
    ship.api_stype === 8 || ship.api_stype === 9 || ship.api_stype === 10 || ship.api_stype === 12,
)

const isSubmarineTender = overShipProp((ship) => ship.api_stype === 20)

const isSubmarine = overShipProp((ship) => ship.api_stype === 13 || ship.api_stype === 14)

const isNagatoKaiNi = shipIdIs(541)

const isMutsuKaiNi = shipIdIs(573)

const isNelson = _.overSome([shipIdIs(571), shipIdIs(576)])

const isColorado = _.overSome([shipIdIs(601), shipIdIs(1496)])

const isKongoKaiNiC = shipIdIs(591)

const isHieiKaiNiC = shipIdIs(592)

const isHarunaKaiNi = shipIdIs(151)

const isKirishimaKaiNi = shipIdIs(152)

const isWarspite = _.overSome([shipIdIs(364), shipIdIs(439)])

const isNelsonSpAttack = _.overEvery([
  isSpAttackNotUsed,
  isFullFleet,
  overShip(0)(_.overEvery([isNelson, isNotMidDmg])),
  overShip(1)(isNotSub),
  overShip(2)(_.overEvery([isNotSub, isNotCarrier])),
  overShip(3)(isNotSub),
  overShip(4)(_.overEvery([isNotSub, isNotCarrier])),
  overShip(5)(isNotSub),
])

const isNagatoSpAttack = _.overEvery([
  isSpAttackNotUsed,
  isFullFleet,
  overShip(0)(_.overEvery([isNagatoKaiNi, isNotMidDmg])),
  overShip(1)(isBattleShip),
  overShip(2)(isNotSub),
  overShip(3)(isNotSub),
  overShip(4)(isNotSub),
  overShip(5)(isNotSub),
])

const isMutsuSpAttack = _.overEvery([
  isSpAttackNotUsed,
  isFullFleet,
  overShip(0)(_.overEvery([isMutsuKaiNi, isNotMidDmg])),
  overShip(1)(isBattleShip),
  overShip(2)(isNotSub),
  overShip(3)(isNotSub),
  overShip(4)(isNotSub),
  overShip(5)(isNotSub),
])

const isColoradoSpAttack = _.overEvery([
  isSpAttackNotUsed,
  isFullFleet,
  overShip(0)(_.overEvery([isColorado, isNotLightDmg])),
  overShip(1)(_.overEvery([isBattleShip, isNotHeavyDmg])),
  overShip(2)(_.overEvery([isBattleShip, isNotHeavyDmg])),
  overShip(3)(isNotSub),
  overShip(4)(isNotSub),
  overShip(5)(isNotSub),
])

const isKongoClassKaiNiCSpAttack = _.overEvery([
  isSpAttackNotUsed,
  isFleetWith5NonSubs,
  _.overSome([
    _.overEvery([
      overShip(0)(_.overEvery([isKongoKaiNiC, isNotMidDmg])),
      overShip(1)(
        _.overEvery([_.overSome([isHieiKaiNiC, isHarunaKaiNi, isWarspite]), isNotMidDmg]),
      ),
    ]),
    _.overEvery([
      overShip(0)(_.overEvery([isHieiKaiNiC, isNotMidDmg])),
      overShip(1)(_.overEvery([_.overSome([isKongoKaiNiC, isKirishimaKaiNi]), isNotMidDmg])),
    ]),
  ]),
])

const isSubmarineSpAttack = _.overEvery([
  hasShipMoreThan(3),
  hasSubmarineSupply,
  isNotInCombinedFleet,
  overShip(0)(_.overEvery([isSubmarineTender, isLevelOver(30), isNotHeavyDmg])),
  overShip(1)(isSubmarine),
  overShip(2)(isSubmarine),
  overNotLessThan(2)([
    overShip(1)(isNotMidDmg),
    overShip(2)(isNotMidDmg),
    _.overEvery(hasShipMoreThan(4), overShip(3)(_.overEvery(isSubmarine, isNotMidDmg))),
  ]),
])

export const isSpAttackAvailable = _.overSome([
  isNelsonSpAttack,
  isNagatoSpAttack,
  isMutsuSpAttack,
  isColoradoSpAttack,
  isKongoClassKaiNiCSpAttack,
  isSubmarineSpAttack,
])
