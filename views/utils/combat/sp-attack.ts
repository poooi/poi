import type { GameShip, ShipPredicate } from './types'

import { ctypeIs, shipIdIs } from './combinators'
import {
  isHarunaKaiNiB,
  isHyuuGaK2,
  isIseK2,
  isKai,
  isMusashiK2,
  isNotSubmarine,
  isYamatoK2,
} from './ship-predicates'

export interface ExtraData {
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

type Predicate = (ships: GameShip[], extraData: ExtraData) => boolean

// Typed combinators for fleet-level predicates
const overEvery =
  (fns: Predicate[]): Predicate =>
  (ships, extraData) =>
    fns.every((fn) => fn(ships, extraData))
const overSome =
  (fns: Predicate[]): Predicate =>
  (ships, extraData) =>
    fns.some((fn) => fn(ships, extraData))

// Typed combinators for ship-level predicates
const shipEvery =
  (fns: ShipPredicate[]): ShipPredicate =>
  (ship) =>
    fns.every((f) => f(ship))
const shipSome =
  (fns: ShipPredicate[]): ShipPredicate =>
  (ship) =>
    fns.some((f) => f(ship))

const overNotLessThan =
  (n: number) =>
  (funcs: Predicate[]): Predicate =>
  (ships, extraData) =>
    funcs.map((func) => func(ships, extraData)).filter((result) => result).length >= n

const isSpAttackLessThan =
  (types: number[]) =>
  (count: number): Predicate =>
  (_ships, extraData) =>
    types.map((type) => extraData.spAttackCount[type] || 0).reduce((a, b) => a + b, 0) < count

const hasSubmarineSupply: Predicate = (_ships, extraData) => extraData.submarineSupplyCount > 0

const isNotInCombinedFleet: Predicate = (_ships, extraData) =>
  !extraData.combinedFlag || extraData.fleetId > 1

const hasShipMoreThan =
  (n: number): Predicate =>
  (ships, _extraData) =>
    ships.length >= n

const isFullFleet = hasShipMoreThan(6)

const isFleetWith5NonSubs: Predicate = (ships, _extraData) =>
  ships.filter(isNotSubmarine).length >= 5

const overShip =
  (n: number) =>
  (func: ShipPredicate): Predicate =>
  (ships, _extraData) =>
    ships[n] != null && func(ships[n])

const isNotMidDmg: ShipPredicate = (ship) => (ship.api_nowhp ?? 0) * 2 > (ship.api_maxhp ?? 0)

const isNotHeavyDmg: ShipPredicate = (ship) => (ship.api_nowhp ?? 0) * 4 > (ship.api_maxhp ?? 0)

const isLevelOver =
  (level: number): ShipPredicate =>
  (ship) =>
    (ship.api_lv ?? 0) >= level

const isNotCarrier: ShipPredicate = (ship) =>
  ship.api_stype !== 7 && ship.api_stype !== 11 && ship.api_stype !== 18

// unlike the shared isBattleship, 超弩級戦艦 (stype 12) also qualifies here
const isBattleShip: ShipPredicate = (ship) =>
  ship.api_stype === 8 || ship.api_stype === 9 || ship.api_stype === 10 || ship.api_stype === 12

const isSubmarineTender: ShipPredicate = (ship) => ship.api_stype === 20

const isSubmarine: ShipPredicate = (ship) => ship.api_stype === 13 || ship.api_stype === 14

const isNagatoKaiNi = shipIdIs(541)

const isMutsuKaiNi = shipIdIs(573)

const isNelsonClass = ctypeIs(88)

const isNelsonClassKai: ShipPredicate = (ship) => isNelsonClass(ship) && isKai(ship)

const isColoradoClass = ctypeIs(93)

const isKongoKaiNiC = shipIdIs(591)

const isHieiKaiNiC = shipIdIs(592)

const isHarunaKaiNi = shipIdIs(151)

const isHarunaKaiNiC = shipIdIs(954)

const isKirishimaKaiNi = shipIdIs(152)

const isKirishimaKaiNiC = shipIdIs(694)

const isWarspite: ShipPredicate = (ship) => shipIdIs(364)(ship) || shipIdIs(439)(ship)

const isWarspiteKai = shipIdIs(364)

const isValiant: ShipPredicate = (ship) => shipIdIs(927)(ship) || shipIdIs(733)(ship)

const isValiantKai = shipIdIs(733)

const isRichelieuKaiOrDeux: ShipPredicate = (ship) => shipIdIs(392)(ship) || shipIdIs(969)(ship)

const isJeanBartKai = shipIdIs(724)

const isBismarckDrei = shipIdIs(178)

const isIowaKai = shipIdIs(360)

const isFusoKaiNi = shipIdIs(411)

const isYamashiroKaiNi = shipIdIs(412)

const isItalia = shipIdIs(446)

const isRomaKai = shipIdIs(447)

const isSouthDakotaKai = shipIdIs(697)

const isWashingtonKai = shipIdIs(659)

// https://wikiwiki.jp/kancolle/Nelson#NelsonTouch
const isNelsonSpAttack = overEvery([
  isSpAttackLessThan([SP_ATTACK_ID.Nelson_Touch])(1),
  isFullFleet,
  overShip(0)(shipEvery([isNelsonClass, isNotMidDmg])),
  overShip(1)(isNotSubmarine),
  overShip(2)(shipEvery([isNotSubmarine, isNotCarrier])),
  overShip(3)(isNotSubmarine),
  overShip(4)(shipEvery([isNotSubmarine, isNotCarrier])),
  overShip(5)(isNotSubmarine),
])

// https://wikiwiki.jp/kancolle/%E9%95%B7%E9%96%80%E6%94%B9%E4%BA%8C#isseisya
const isNagatoSpAttack = overEvery([
  isSpAttackLessThan([SP_ATTACK_ID.Nagato_Punch])(1),
  isFullFleet,
  overShip(0)(shipEvery([isNagatoKaiNi, isNotMidDmg])),
  overShip(1)(shipEvery([isBattleShip, isNotHeavyDmg])),
  overShip(2)(isNotSubmarine),
  overShip(3)(isNotSubmarine),
  overShip(4)(isNotSubmarine),
  overShip(5)(isNotSubmarine),
])

// https://wikiwiki.jp/kancolle/%E9%99%B8%E5%A5%A5%E6%94%B9%E4%BA%8C#isseisya
const isMutsuSpAttack = overEvery([
  isSpAttackLessThan([SP_ATTACK_ID.Mutsu_Splash])(1),
  isFullFleet,
  overShip(0)(shipEvery([isMutsuKaiNi, isNotMidDmg])),
  overShip(1)(shipEvery([isBattleShip, isNotHeavyDmg])),
  overShip(2)(isNotSubmarine),
  overShip(3)(isNotSubmarine),
  overShip(4)(isNotSubmarine),
  overShip(5)(isNotSubmarine),
])

// https://wikiwiki.jp/kancolle/Colorado#ColoTouch
const isColoradoSpAttack = overEvery([
  isSpAttackLessThan([SP_ATTACK_ID.Colorado_Fire])(1),
  isFullFleet,
  overShip(0)(shipEvery([isColoradoClass, isNotMidDmg])),
  overShip(1)(shipEvery([isBattleShip, isNotHeavyDmg])),
  overShip(2)(shipEvery([isBattleShip, isNotHeavyDmg])),
  overShip(3)(isNotSubmarine),
  overShip(4)(isNotSubmarine),
  overShip(5)(isNotSubmarine),
])

// https://wikiwiki.jp/kancolle/%E9%87%91%E5%89%9B%E6%94%B9%E4%BA%8C%E4%B8%99#SpecialAttack
const isKongoClassKaiNiCSpAttack = overEvery([
  isSpAttackLessThan([SP_ATTACK_ID.Kongo_Class_Kaini_C_Charge])(3),
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
            isKirishimaKaiNiC,
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

// https://wikiwiki.jp/kancolle/%E5%A4%A7%E9%AF%A8#SpecialAttack
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

// https://wikiwiki.jp/kancolle/%E5%A4%A7%E5%92%8C%E6%94%B9%E4%BA%8C#SpecialAttack
const isYamatoDoubleAttack = overEvery([
  isFullFleet,
  overSome([
    overEvery([overShip(0)(isYamatoK2), overShip(1)(isMusashiK2)]),
    overEvery([overShip(0)(isYamatoK2), overShip(1)(isBismarckDrei)]),
    overEvery([overShip(0)(isYamatoK2), overShip(1)(isIowaKai)]),
    overEvery([overShip(0)(isYamatoK2), overShip(1)(isRichelieuKaiOrDeux)]),
    overEvery([overShip(0)(isYamatoK2), overShip(1)(isJeanBartKai)]),
    overEvery([overShip(0)(isMusashiK2), overShip(1)(isYamatoK2)]),
  ]),
  overShip(0)(isNotMidDmg),
  overShip(1)(isNotMidDmg),
  overShip(2)(isNotSubmarine),
  overShip(3)(isNotSubmarine),
  overShip(4)(isNotSubmarine),
  overShip(5)(isNotSubmarine),
])

const isYamatoTripleAttack = overEvery([
  isFullFleet,
  overSome([
    overEvery([overShip(1)(isMusashiK2), overShip(2)(isNagatoKaiNi)]),
    overEvery([overShip(1)(isMusashiK2), overShip(2)(isMutsuKaiNi)]),
    overEvery([overShip(1)(isNagatoKaiNi), overShip(2)(isMutsuKaiNi)]),
    overEvery([overShip(1)(isMutsuKaiNi), overShip(2)(isNagatoKaiNi)]),
    overEvery([overShip(1)(isIseK2), overShip(2)(isHyuuGaK2)]),
    overEvery([overShip(1)(isHyuuGaK2), overShip(2)(isIseK2)]),
    overEvery([overShip(1)(isFusoKaiNi), overShip(2)(isYamashiroKaiNi)]),
    overEvery([overShip(1)(isYamashiroKaiNi), overShip(2)(isFusoKaiNi)]),
    overEvery([overShip(1)(isNelsonClass), overShip(2)(isWarspite)]),
    overEvery([overShip(1)(isWarspite), overShip(2)(isNelsonClass)]),
    overEvery([overShip(1)(isValiant), overShip(2)(isWarspite)]),
    overEvery([overShip(1)(isWarspite), overShip(2)(isValiant)]),
    overEvery([overShip(1)(isNelsonClassKai), overShip(2)(isNelsonClassKai)]),
    overEvery([overShip(1)(isKongoKaiNiC), overShip(2)(isHieiKaiNiC)]),
    overEvery([overShip(1)(isHieiKaiNiC), overShip(2)(isKongoKaiNiC)]),
    overEvery([overShip(1)(isKongoKaiNiC), overShip(2)(isHarunaKaiNiB)]),
    overEvery([overShip(1)(isHarunaKaiNiB), overShip(2)(isKongoKaiNiC)]),
    overEvery([overShip(1)(isKongoKaiNiC), overShip(2)(isHarunaKaiNiC)]),
    overEvery([overShip(1)(isHarunaKaiNiC), overShip(2)(isKongoKaiNiC)]),
    overEvery([overShip(1)(isKongoKaiNiC), overShip(2)(isKirishimaKaiNiC)]),
    overEvery([overShip(1)(isKirishimaKaiNiC), overShip(2)(isKongoKaiNiC)]),
    overEvery([overShip(1)(isHieiKaiNiC), overShip(2)(isKirishimaKaiNiC)]),
    overEvery([overShip(1)(isKirishimaKaiNiC), overShip(2)(isHieiKaiNiC)]),
    overEvery([overShip(1)(isSouthDakotaKai), overShip(2)(isWashingtonKai)]),
    overEvery([overShip(1)(isWashingtonKai), overShip(2)(isSouthDakotaKai)]),
    overEvery([overShip(1)(isItalia), overShip(2)(isRomaKai)]),
    overEvery([overShip(1)(isRomaKai), overShip(2)(isItalia)]),
    overEvery([overShip(1)(isColoradoClass), overShip(2)(isColoradoClass)]),
    overEvery([overShip(1)(isRichelieuKaiOrDeux), overShip(2)(isJeanBartKai)]),
    overEvery([overShip(1)(isJeanBartKai), overShip(2)(isRichelieuKaiOrDeux)]),
  ]),
  overShip(0)(shipEvery([isNotMidDmg, isYamatoK2])),
  overShip(1)(isNotMidDmg),
  overShip(2)(isNotMidDmg),
  overShip(3)(isNotSubmarine),
  overShip(4)(isNotSubmarine),
  overShip(5)(isNotSubmarine),
])

const isYamatoAttack = overEvery([
  isFullFleet,
  isSpAttackLessThan([SP_ATTACK_ID.Yamato_Attack_Double, SP_ATTACK_ID.Yamato_Attack_Triple])(1),
  overSome([isYamatoDoubleAttack, isYamatoTripleAttack]),
])

// https://wikiwiki.jp/kancolle/Warspite%E6%94%B9#SpecialAttack
const isQESpAttack = overEvery([
  isSpAttackLessThan([SP_ATTACK_ID.QE_Touch])(1),
  isFullFleet,
  overSome([
    overEvery([overShip(0)(isWarspiteKai), overShip(1)(isValiantKai)]),
    overEvery([overShip(0)(isValiantKai), overShip(1)(isWarspiteKai)]),
  ]),
  overShip(0)(isNotMidDmg),
  overShip(1)(isNotHeavyDmg),
  overShip(2)(isNotSubmarine),
  overShip(3)(isNotSubmarine),
  overShip(4)(isNotSubmarine),
  overShip(5)(isNotSubmarine),
])

// https://wikiwiki.jp/kancolle/Richelieu%E6%94%B9#SpecialAttack
const isBaguetteSpAttack = overEvery([
  isSpAttackLessThan([SP_ATTACK_ID.Baguette_Charge])(1),
  isFullFleet,
  overSome([
    overEvery([overShip(0)(isRichelieuKaiOrDeux), overShip(1)(isJeanBartKai)]),
    overEvery([overShip(0)(isJeanBartKai), overShip(1)(isRichelieuKaiOrDeux)]),
  ]),
  overShip(0)(isNotMidDmg),
  overShip(1)(isNotHeavyDmg),
  overShip(2)(isNotSubmarine),
  overShip(3)(isNotSubmarine),
  overShip(4)(isNotSubmarine),
  overShip(5)(isNotSubmarine),
])

// isSpAttackAvailable(ships: GameShip[], extraData: ExtraData): boolean
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
