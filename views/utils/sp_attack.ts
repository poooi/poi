interface MasterShip {
  api_stype?: number
  api_ctype?: number
  [key: string]: unknown
}

interface ActualShip {
  api_ship_id?: number
  api_nowhp?: number
  api_maxhp?: number
  api_lv?: number
  [key: string]: unknown
}

type ShipData = [ActualShip, MasterShip]

interface ExtraData {
  spAttackCount: Record<number, number>
  submarineSupplyCount: number
  combinedFlag?: boolean
  fleetId: number
}

const SP_ATTACK_ID = {
  Nelson_Touch: 100,
  Nagato_Punch: 101,
  Mutsu_Splash: 102,
  Colorado_Fire: 103,
  Kongo_Class_Kaini_C_Charge: 104,
  Baguette_Charge: 105,
  QE_Touch: 106,
  Yamato_Attack_Triple: 400,
  Yamato_Attack_Double: 401,
  Submarine_Special_Attack: 302,
}

type Predicate = (shipsData: ShipData[], extraData: ExtraData) => boolean
type ShipPred = (ship: ShipData) => boolean

// Typed combinators for fleet-level predicates
const overEvery =
  (fns: Predicate[]): Predicate =>
  (shipsData, extraData) =>
    fns.every((fn) => fn(shipsData, extraData))
const overSome =
  (fns: Predicate[]): Predicate =>
  (shipsData, extraData) =>
    fns.some((fn) => fn(shipsData, extraData))

// Typed combinators for ship-level predicates
const shipEvery =
  (fns: ShipPred[]): ShipPred =>
  (ship) =>
    fns.every((f) => f(ship))
const shipSome =
  (fns: ShipPred[]): ShipPred =>
  (ship) =>
    fns.some((f) => f(ship))

const overNotLessThan =
  (n: number) =>
  (funcs: Predicate[]): Predicate =>
  (shipsData, extraData) =>
    funcs.map((func) => func(shipsData, extraData)).filter((result) => result).length >= n

const isSpAttackLessThan =
  (types: number[]) =>
  (count: number): Predicate =>
  (shipsData, extraData) =>
    types.map((type) => extraData.spAttackCount[type] || 0).reduce((a, b) => a + b, 0) < count

const hasSubmarineSupply: Predicate = (_shipsData, extraData) => extraData.submarineSupplyCount > 0

const isNotInCombinedFleet: Predicate = (_shipsData, extraData) =>
  !extraData.combinedFlag || extraData.fleetId > 1

const hasShipMoreThan =
  (n: number): Predicate =>
  (shipsData, _extraData) =>
    shipsData && shipsData.length >= n

const isFullFleet = hasShipMoreThan(6)

const isFleetWith5NonSubs: Predicate = (shipsData, _extraData) =>
  shipsData && shipsData.filter(isNotSub).length >= 5

const overShip =
  (n: number) =>
  (func: ShipPred): Predicate =>
  (shipsData, _extraData) =>
    func(shipsData[n])

const overShipState =
  (func: (ship: ActualShip) => boolean): ShipPred =>
  (ship) =>
    func(ship[0])

const overShipProp =
  (func: (ship: MasterShip) => boolean): ShipPred =>
  (ship) =>
    func(ship[1])

const shipIdIs = (n: number): ShipPred => overShipState((ship) => ship.api_ship_id === n)

const isNotMidDmg = overShipState((ship) => (ship.api_nowhp ?? 0) * 2 > (ship.api_maxhp ?? 0))

const isNotHeavyDmg = overShipState((ship) => (ship.api_nowhp ?? 0) * 4 > (ship.api_maxhp ?? 0))

const isLevelOver = (level: number): ShipPred =>
  overShipState((ship) => (ship.api_lv ?? 0) >= level)

const shipClassTypeIs = (n: number): ShipPred => overShipProp((ship) => ship.api_ctype === n)

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

const isNelsonClass = shipClassTypeIs(88)

const isColoradoClass = shipClassTypeIs(93)

const isKongoKaiNiC = shipIdIs(591)

const isHieiKaiNiC = shipIdIs(592)

const isHarunaKaiNi = shipIdIs(151)

const isHarunaKaiNiB = shipIdIs(593)

const isHarunaKaiNiC = shipIdIs(954)

const isKirishimaKaiNi = shipIdIs(152)

const isKirishimaKaiNiC = shipIdIs(694)

const isWarspite: ShipPred = (ship) => shipIdIs(364)(ship) || shipIdIs(439)(ship)

const isWarspiteKai = shipIdIs(364)

const isValiant: ShipPred = (ship) => shipIdIs(927)(ship) || shipIdIs(733)(ship)

const isValiantKai = shipIdIs(733)

const isRichelieuKaiOrDeux: ShipPred = (ship) => shipIdIs(392)(ship) || shipIdIs(969)(ship)

const isJeanBartKai = shipIdIs(724)

const isYamatoKaiNi: ShipPred = (ship) => shipIdIs(911)(ship) || shipIdIs(916)(ship)

const isMusashiKaiNi = shipIdIs(546)

const isBismarckDrei = shipIdIs(178)

const isIowaKai = shipIdIs(360)

const isIseKaiNi = shipIdIs(553)

const isHyugaKaiNi = shipIdIs(554)

const isFusoKaiNi = shipIdIs(411)

const isYamashiroKaiNi = shipIdIs(412)

const isItalia = shipIdIs(446)

const isRomaKai = shipIdIs(447)

const isSouthDakotaKai = shipIdIs(697)

const isWashingtonKai = shipIdIs(659)

const isNelsonSpAttack = overEvery([
  isSpAttackLessThan([SP_ATTACK_ID.Nelson_Touch])(1),
  isFullFleet,
  overShip(0)(shipEvery([isNelsonClass, isNotMidDmg])),
  overShip(1)(isNotSub),
  overShip(2)(shipEvery([isNotSub, isNotCarrier])),
  overShip(3)(isNotSub),
  overShip(4)(shipEvery([isNotSub, isNotCarrier])),
  overShip(5)(isNotSub),
])

const isNagatoSpAttack = overEvery([
  isSpAttackLessThan([SP_ATTACK_ID.Nagato_Punch])(1),
  isFullFleet,
  overShip(0)(shipEvery([isNagatoKaiNi, isNotMidDmg])),
  overShip(1)(shipEvery([isBattleShip, isNotHeavyDmg])),
  overShip(2)(isNotSub),
  overShip(3)(isNotSub),
  overShip(4)(isNotSub),
  overShip(5)(isNotSub),
])

const isMutsuSpAttack = overEvery([
  isSpAttackLessThan([SP_ATTACK_ID.Mutsu_Splash])(1),
  isFullFleet,
  overShip(0)(shipEvery([isMutsuKaiNi, isNotMidDmg])),
  overShip(1)(shipEvery([isBattleShip, isNotHeavyDmg])),
  overShip(2)(isNotSub),
  overShip(3)(isNotSub),
  overShip(4)(isNotSub),
  overShip(5)(isNotSub),
])

const isColoradoSpAttack = overEvery([
  isSpAttackLessThan([SP_ATTACK_ID.Colorado_Fire])(1),
  isFullFleet,
  overShip(0)(shipEvery([isColoradoClass, isNotMidDmg])),
  overShip(1)(shipEvery([isBattleShip, isNotHeavyDmg])),
  overShip(2)(shipEvery([isBattleShip, isNotHeavyDmg])),
  overShip(3)(isNotSub),
  overShip(4)(isNotSub),
  overShip(5)(isNotSub),
])

const isKongoClassKaiNiCSpAttack = overEvery([
  isSpAttackLessThan([SP_ATTACK_ID.Kongo_Class_Kaini_C_Charge])(2),
  isFleetWith5NonSubs,
  overSome([
    // Kongo Kai Ni C
    overEvery([
      overShip(0)(shipEvery([isKongoKaiNiC, isNotMidDmg])),
      overShip(1)(
        shipEvery([
          shipSome([
            isHieiKaiNiC,
            isHarunaKaiNi,
            isHarunaKaiNiB,
            isHarunaKaiNiC,
            isKirishimaKaiNi,
            isWarspite,
            isValiant,
          ]),
          isNotMidDmg,
        ]),
      ),
    ]),
    // Hiei Kai Ni C
    overEvery([
      overShip(0)(shipEvery([isHieiKaiNiC, isNotMidDmg])),
      overShip(1)(
        shipEvery([
          shipSome([
            isKongoKaiNiC,
            isHarunaKaiNiB,
            isHarunaKaiNiC,
            isKirishimaKaiNi,
            isKirishimaKaiNiC,
          ]),
          isNotMidDmg,
        ]),
      ),
    ]),
    // Haruna Kai Ni B/C
    overEvery([
      overShip(0)(shipEvery([shipSome([isHarunaKaiNiB, isHarunaKaiNiC]), isNotMidDmg])),
      overShip(1)(
        shipEvery([shipSome([isKongoKaiNiC, isHieiKaiNiC, isKirishimaKaiNiC]), isNotMidDmg]),
      ),
    ]),
    // Kirishima Kai Ni C
    overEvery([
      overShip(0)(shipEvery([isKirishimaKaiNiC, isNotMidDmg])),
      overShip(1)(
        shipEvery([
          shipSome([isKongoKaiNiC, isHieiKaiNiC, isHarunaKaiNiB, isHarunaKaiNiC, isSouthDakotaKai]),
          isNotMidDmg,
        ]),
      ),
    ]),
  ]),
])

const isSubmarineSpAttack = overEvery([
  hasShipMoreThan(3),
  hasSubmarineSupply,
  isNotInCombinedFleet,
  overShip(0)(shipEvery([isSubmarineTender, isLevelOver(30), isNotHeavyDmg])),
  overShip(1)(isSubmarine),
  overShip(2)(isSubmarine),
  overNotLessThan(2)([
    overShip(1)(isNotMidDmg),
    overShip(2)(isNotMidDmg),
    overEvery([hasShipMoreThan(4), overShip(3)(shipEvery([isSubmarine, isNotMidDmg]))]),
  ]),
])

const isYamatoDoubleAttack = overEvery([
  isFullFleet,
  overSome([
    overEvery([overShip(0)(isYamatoKaiNi), overShip(1)(isMusashiKaiNi)]),
    overEvery([overShip(0)(isYamatoKaiNi), overShip(1)(isBismarckDrei)]),
    overEvery([overShip(0)(isYamatoKaiNi), overShip(1)(isIowaKai)]),
    overEvery([overShip(0)(isYamatoKaiNi), overShip(1)(isRichelieuKaiOrDeux)]),
    overEvery([overShip(0)(isMusashiKaiNi), overShip(1)(isYamatoKaiNi)]),
  ]),
  overShip(0)(isNotMidDmg),
  overShip(1)(isNotMidDmg),
  overShip(2)(isNotSub),
  overShip(3)(isNotSub),
  overShip(4)(isNotSub),
  overShip(5)(isNotSub),
])

const isYamatoTripleAttack = overEvery([
  isFullFleet,
  overSome([
    overEvery([overShip(1)(isMusashiKaiNi), overShip(2)(isNagatoKaiNi)]),
    overEvery([overShip(1)(isMusashiKaiNi), overShip(2)(isMutsuKaiNi)]),
    overEvery([overShip(1)(isNagatoKaiNi), overShip(2)(isMutsuKaiNi)]),
    overEvery([overShip(1)(isMutsuKaiNi), overShip(2)(isNagatoKaiNi)]),
    overEvery([overShip(1)(isIseKaiNi), overShip(2)(isHyugaKaiNi)]),
    overEvery([overShip(1)(isHyugaKaiNi), overShip(2)(isIseKaiNi)]),
    overEvery([overShip(1)(isFusoKaiNi), overShip(2)(isYamashiroKaiNi)]),
    overEvery([overShip(1)(isYamashiroKaiNi), overShip(2)(isFusoKaiNi)]),
    overEvery([overShip(1)(isNelsonClass), overShip(2)(isWarspite)]),
    overEvery([overShip(1)(isWarspite), overShip(2)(isNelsonClass)]),
    overEvery([overShip(1)(isKongoKaiNiC), overShip(2)(isHieiKaiNiC)]),
    overEvery([overShip(1)(isHieiKaiNiC), overShip(2)(isKongoKaiNiC)]),
    overEvery([overShip(1)(isSouthDakotaKai), overShip(2)(isWashingtonKai)]),
    overEvery([overShip(1)(isWashingtonKai), overShip(2)(isSouthDakotaKai)]),
    overEvery([overShip(1)(isItalia), overShip(2)(isRomaKai)]),
    overEvery([overShip(1)(isRomaKai), overShip(2)(isItalia)]),
    overEvery([overShip(1)(isColoradoClass), overShip(2)(isColoradoClass)]),
  ]),
  overShip(0)(shipEvery([isNotMidDmg, isYamatoKaiNi])),
  overShip(1)(isNotMidDmg),
  overShip(2)(isNotMidDmg),
  overShip(3)(isNotSub),
  overShip(4)(isNotSub),
  overShip(5)(isNotSub),
])

const isYamatoAttack = overEvery([
  isFullFleet,
  isSpAttackLessThan([SP_ATTACK_ID.Yamato_Attack_Double, SP_ATTACK_ID.Yamato_Attack_Triple])(1),
  overSome([isYamatoDoubleAttack, isYamatoTripleAttack]),
])

const isQESpAttack = overEvery([
  isSpAttackLessThan([SP_ATTACK_ID.QE_Touch])(1),
  isFullFleet,
  overSome([
    overEvery([overShip(0)(isWarspiteKai), overShip(1)(isValiantKai)]),
    overEvery([overShip(0)(isValiantKai), overShip(1)(isWarspiteKai)]),
  ]),
  overShip(0)(isNotMidDmg),
  overShip(1)(isNotHeavyDmg),
  overShip(2)(isNotSub),
  overShip(3)(isNotSub),
  overShip(4)(isNotSub),
  overShip(5)(isNotSub),
])

const isBaguetteSpAttack = overEvery([
  isSpAttackLessThan([SP_ATTACK_ID.Baguette_Charge])(1),
  isFullFleet,
  overSome([
    overEvery([overShip(0)(isRichelieuKaiOrDeux), overShip(1)(isJeanBartKai)]),
    overEvery([overShip(0)(isJeanBartKai), overShip(1)(isRichelieuKaiOrDeux)]),
  ]),
  overShip(0)(isNotMidDmg),
  overShip(1)(isNotHeavyDmg),
  overShip(2)(isNotSub),
  overShip(3)(isNotSub),
  overShip(4)(isNotSub),
  overShip(5)(isNotSub),
])

export const isSpAttackAvailable = overSome([
  isNelsonSpAttack,
  isNagatoSpAttack,
  isMutsuSpAttack,
  isColoradoSpAttack,
  isKongoClassKaiNiCSpAttack,
  isSubmarineSpAttack,
  isYamatoAttack,
  isQESpAttack,
  isBaguetteSpAttack,
])
