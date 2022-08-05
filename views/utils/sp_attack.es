import _ from 'lodash'

const SP_ATTACK_ID = {
  Nelson_Touch: 100,
  Nagato_Punch: 101,
  Mutsu_Splash: 102,
  Colorado_Fire: 103,
  Kongo_Class_Kaini_C_Charge: 104,
  Yamato_Attack_Triple: 400,
  Yamato_Attack_Double: 401,
  Submarine_Special_Attack: 302,
}

const overNotLessThan =
  (n) =>
  ([...funcs]) =>
  (...data) =>
    funcs.map((func) => func(...data)).filter((result) => result).length >= n

const isSpAttackLessThan = (types) => (count) => (shipsData, extraData) =>
  types.map((type) => extraData.spAttackCount[type] || 0).reduce((a, b) => a + b, 0) < count

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

const isMaryland = _.overSome([shipIdIs(913), shipIdIs(918)])

const isColoradoClass = _.overSome([isColorado, isMaryland])

const isKongoKaiNiC = shipIdIs(591)

const isHieiKaiNiC = shipIdIs(592)

const isHarunaKaiNi = shipIdIs(151)

const isKirishimaKaiNi = shipIdIs(152)

const isWarspite = _.overSome([shipIdIs(364), shipIdIs(439)])

const isYamatoKaiNi = _.overSome([shipIdIs(911), shipIdIs(916)])

const isMusashiKaiNi = shipIdIs(546)

const isBismarckDrei = shipIdIs(178)

const isIowaKai = shipIdIs(360)

const isRichelieuKai = shipIdIs(392)

const isIseKaiNi = shipIdIs(553)

const isHyugaKaiNi = shipIdIs(554)

const isFusoKaiNi = shipIdIs(411)

const isYamashiroKaiNi = shipIdIs(412)

const isItalia = shipIdIs(446)

const isRomaKai = shipIdIs(447)

const isSouthDakotaKai = shipIdIs(697)

const isWashingtonKai = shipIdIs(659)

const isNelsonSpAttack = _.overEvery([
  isSpAttackLessThan([SP_ATTACK_ID.Nelson_Touch])(1),
  isFullFleet,
  overShip(0)(_.overEvery([isNelson, isNotMidDmg])),
  overShip(1)(isNotSub),
  overShip(2)(_.overEvery([isNotSub, isNotCarrier])),
  overShip(3)(isNotSub),
  overShip(4)(_.overEvery([isNotSub, isNotCarrier])),
  overShip(5)(isNotSub),
])

const isNagatoSpAttack = _.overEvery([
  isSpAttackLessThan([SP_ATTACK_ID.Nagato_Punch])(1),
  isFullFleet,
  overShip(0)(_.overEvery([isNagatoKaiNi, isNotMidDmg])),
  overShip(1)(_.overEvery([isBattleShip, isNotHeavyDmg])),
  overShip(2)(isNotSub),
  overShip(3)(isNotSub),
  overShip(4)(isNotSub),
  overShip(5)(isNotSub),
])

const isMutsuSpAttack = _.overEvery([
  isSpAttackLessThan([SP_ATTACK_ID.Mutsu_Splash])(1),
  isFullFleet,
  overShip(0)(_.overEvery([isMutsuKaiNi, isNotMidDmg])),
  overShip(1)(_.overEvery([isBattleShip, isNotHeavyDmg])),
  overShip(2)(isNotSub),
  overShip(3)(isNotSub),
  overShip(4)(isNotSub),
  overShip(5)(isNotSub),
])

const isColoradoSpAttack = _.overEvery([
  isSpAttackLessThan([SP_ATTACK_ID.Colorado_Fire])(1),
  isFullFleet,
  overShip(0)(_.overEvery([isColoradoClass, isNotMidDmg])),
  overShip(1)(_.overEvery([isBattleShip, isNotHeavyDmg])),
  overShip(2)(_.overEvery([isBattleShip, isNotHeavyDmg])),
  overShip(3)(isNotSub),
  overShip(4)(isNotSub),
  overShip(5)(isNotSub),
])

const isKongoClassKaiNiCSpAttack = _.overEvery([
  isSpAttackLessThan([SP_ATTACK_ID.Kongo_Class_Kaini_C_Charge])(2),
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

const isYamatoDoubleAttack = _.overEvery([
  isFullFleet,
  _.overSome(
    _.overEvery(overShip(0)(isYamatoKaiNi), overShip(1)(isMusashiKaiNi)),
    _.overEvery(overShip(0)(isYamatoKaiNi), overShip(1)(isBismarckDrei)),
    _.overEvery(overShip(0)(isYamatoKaiNi), overShip(1)(isIowaKai)),
    _.overEvery(overShip(0)(isYamatoKaiNi), overShip(1)(isRichelieuKai)),
    _.overEvery(overShip(0)(isMusashiKaiNi), overShip(1)(isYamatoKaiNi)),
  ),
  overShip(0)(isNotMidDmg),
  overShip(1)(isNotMidDmg),
  overShip(2)(isNotSub),
  overShip(3)(isNotSub),
  overShip(4)(isNotSub),
  overShip(5)(isNotSub),
])

const isYamatoTripleAttack = _.overEvery([
  isFullFleet,
  _.overSome(
    _.overEvery(overShip(1)(isMusashiKaiNi), overShip(2)(isNagatoKaiNi)),
    _.overEvery(overShip(1)(isMusashiKaiNi), overShip(2)(isMutsuKaiNi)),
    _.overEvery(overShip(1)(isNagatoKaiNi), overShip(2)(isMutsuKaiNi)),
    _.overEvery(overShip(1)(isIseKaiNi), overShip(2)(isHyugaKaiNi)),
    _.overEvery(overShip(1)(isFusoKaiNi), overShip(2)(isYamashiroKaiNi)),
    _.overEvery(overShip(1)(isNelson), overShip(2)(isWarspite)),
    _.overEvery(overShip(1)(isKongoKaiNiC), overShip(2)(isHieiKaiNiC)),
    _.overEvery(overShip(1)(isSouthDakotaKai), overShip(2)(isWashingtonKai)),
    _.overEvery(overShip(1)(isItalia), overShip(2)(isRomaKai)),
    _.overEvery(overShip(1)(isColorado), overShip(2)(isMaryland)),
  ),
  overShip(0)(_.overEvery(isNotMidDmg, isYamatoKaiNi)),
  overShip(1)(isNotMidDmg),
  overShip(2)(isNotMidDmg),
  overShip(3)(isNotSub),
  overShip(4)(isNotSub),
  overShip(5)(isNotSub),
])

const isYamatoAttack = _.overEvery([
  hasShipMoreThan(6),
  isSpAttackLessThan([SP_ATTACK_ID.Yamato_Attack_Double, SP_ATTACK_ID.Yamato_Attack_Triple])(1),
  _.overSome(isYamatoDoubleAttack, isYamatoTripleAttack),
])

export const isSpAttackAvailable = _.overSome([
  isNelsonSpAttack,
  isNagatoSpAttack,
  isMutsuSpAttack,
  isColoradoSpAttack,
  isKongoClassKaiNiCSpAttack,
  isSubmarineSpAttack,
  isYamatoAttack,
])
