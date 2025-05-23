// ported from KC3kai's AACI module
// url: https://github.com/KC3Kai/KC3Kai/blob/master/src/library/modules/AntiAir.js
// commit a9edbe5
// in thankful acknowledgment of their hard work
// some variable and function naming are modified

import { maxBy } from 'lodash'

// check for $slotitemtypes
const itemTypeIs = n => equip => equip.api_type[2] === n

// type for slot item
const iconIs = n => equip => equip.api_type[3] === n

// validAll(f,g...)(x) = f(x) && g(x) && ...
const validAll = (...func) => x => func.every(f => f(x))
const validNot = f => x => !f(x)
const validAny = (...func) => x => func.some(f => f(x))

// avoid modifying this structure directly, use "declareAACI" instead.
export const AACITable = {}

// typeIcons is a array including [ship icon, equip icon, ...]
// predicateShipMst is a function f: f(mst)
// predicateShipObj is a function f: f(shipObj)
// returns a boolean to indicate whether the ship in question (with equipments)
// is capable of performing such type of AACI
const declareAACI = ({ name = '', id, fixed, modifier, shipValid, equipsValid }) => {
  AACITable[id] = {
    name,
    id,
    fixed,
    modifier,
    shipValid,
    equipsValid,
  }
}

const shipIdIs = n => ship => ship.api_ship_id === n
const equipIdIs = n => equip => equip.api_slotitem_id === n
const shipIdIsOneOf = (...shipIds) => ship => shipIds.includes(ship.api_ship_id)
const isKai = (ship) => ship.api_getmes === '<br>'

// "hasAtLeast(pred)(n)(xs)" is the same as:
// xs.filter(pred).length >= n
const hasAtLeast = (pred, n) => xs => xs.filter(pred).length >= n

// "hasSome(pred)(xs)" is the same as:
// xs.some(pred)
const hasSome = pred => xs => xs.some(pred)

// check if slot num of ship (excluding ex slot) equals or greater
const slotNumAtLeast = n => ship => ship.api_slot_num >= n

/*

   reference:

   - https://wikiwiki.jp/kancolle/航空戦#antiairfire (as of Jan 23, 2019)
   - https://kancolle.fandom.com/wiki/Combat/Aerial_Combat (as of Jan 1, 2020)
   - https://github.com/andanteyk/ElectronicObserver/blob/master/ElectronicObserver/Other/Information/apilist.txt (as of Jan 1, 2019)

 */

// 54 = 秋月型
const isAkizukiClass = ship => ship.api_ctype === 54
// icon=16: 高角砲
const isHighAngleMount = iconIs(16)
// 12: 小型電探
// 13: 大型電探
const isRadar = equip => itemTypeIs(12)(equip) || itemTypeIs(13)(equip)

// id 1~3: Akizuki-class
declareAACI({
  name: ['Akizuki Class'],
  id: 1,
  fixed: 7,
  modifier: 1.7,
  shipValid: isAkizukiClass,
  equipsValid: validAll(hasAtLeast(isHighAngleMount, 2), hasSome(isRadar)),
})

declareAACI({
  name: ['Akizuki Class'],
  id: 2,
  fixed: 6,
  modifier: 1.7,
  shipValid: isAkizukiClass,
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isRadar)),
})

declareAACI({
  name: ['Akizuki Class'],
  id: 3,
  fixed: 4,
  modifier: 1.6,
  shipValid: isAkizukiClass,
  equipsValid: validAll(hasAtLeast(isHighAngleMount, 2)),
})

const isBattleship = ship => [8, 9, 10].includes(ship.api_stype)
// 3: 大口径主砲
const isLargeCaliberMainGun = itemTypeIs(3)
// 18: 対空強化弾
const isType3Shell = itemTypeIs(18)
// 36: 高射装置 Anti-aircraft Fire Director
const isAAFD = itemTypeIs(36)
// AA Radar
// Surface Radar are excluded by checking whether
// the equipment gives AA stat (api_tyku)
const isAARadar = equip => isRadar(equip) && equip.api_tyku > 0
const isAdvancedAARadar = equip => isRadar(equip) && equip.api_tyku >= 4

// id 4: battleships
declareAACI({
  name: ['Battle Ship'],
  id: 4,
  fixed: 6,
  modifier: 1.5,
  shipValid: validAll(isBattleship, slotNumAtLeast(4)),
  equipsValid: validAll(
    hasSome(isLargeCaliberMainGun),
    hasSome(isType3Shell),
    hasSome(isAAFD),
    hasSome(isAARadar),
  ),
})

const isNotSubmarine = ship => ![13, 14].includes(ship.api_stype)
// ref wikia: "Built-in HA mount is defined as a single High-Angle gun that has 8￼AA stat or higher."
// (as of Jan 1, 2020)
const isBuiltinHighAngleMount = equip => isHighAngleMount(equip) && equip.api_tyku >= 8

// id 5: all surface ships
declareAACI({
  id: 5,
  fixed: 4,
  modifier: 1.5,
  shipValid: validAll(isNotSubmarine, slotNumAtLeast(3)),
  equipsValid: validAll(hasAtLeast(isBuiltinHighAngleMount, 2), hasSome(isAARadar)),
})

// id 6: battleships
declareAACI({
  name: ['Battle Ship'],
  id: 6,
  fixed: 4,
  modifier: 1.45,
  shipValid: validAll(isBattleship, slotNumAtLeast(3)),
  equipsValid: validAll(hasSome(isLargeCaliberMainGun), hasSome(isType3Shell), hasSome(isAAFD)),
})

// id 7~9: all surface ships
declareAACI({
  id: 7,
  fixed: 3,
  modifier: 1.35,
  shipValid: validAll(isNotSubmarine, slotNumAtLeast(3)),
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAAFD), hasSome(isAARadar)),
})

declareAACI({
  id: 8,
  fixed: 4,
  modifier: 1.4,
  shipValid: validAll(isNotSubmarine, slotNumAtLeast(2)),
  equipsValid: validAll(hasSome(isBuiltinHighAngleMount), hasSome(isAARadar)),
})

declareAACI({
  id: 9,
  fixed: 2,
  modifier: 1.3,
  shipValid: validAll(isNotSubmarine, slotNumAtLeast(2)),
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAAFD)),
})

// 21=対空機銃
const isMachineGun = itemTypeIs(21)
const isMayaK2 = shipIdIs(428)
// ref wikia: "CDMG is defined as any Anti-Air gun that has 9￼AA stat or higher."
const isCDMG = equip => isMachineGun(equip) && equip.api_tyku >= 9

// id: 10~11 Maya K2
declareAACI({
  name: ['摩耶改二'],
  id: 10,
  fixed: 8,
  modifier: 1.65,
  shipValid: isMayaK2,
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isCDMG), hasSome(isAARadar)),
})

declareAACI({
  name: ['摩耶改二'],
  id: 11,
  fixed: 6,
  modifier: 1.5,
  shipValid: isMayaK2,
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isCDMG)),
})

// 21: 対空機銃
const isAAGun = itemTypeIs(21)

declareAACI({
  id: 12,
  fixed: 3,
  modifier: 1.25,
  shipValid: validAll(isNotSubmarine, slotNumAtLeast(3)),
  equipsValid: validAll(hasSome(isCDMG), hasAtLeast(isAAGun, 2), hasSome(isAARadar)),
})

// id 13: all surface ships
declareAACI({
  id: 13,
  fixed: 4,
  modifier: 1.35,
  shipValid: validAll(isNotSubmarine, slotNumAtLeast(3)),
  equipsValid: validAll(
    hasSome(isBuiltinHighAngleMount),
    hasSome(isCDMG),
    hasSome(isAARadar),
  ),
})


const isIsuzuK2 = shipIdIs(141)
// id 14~15: Isuzu K2
declareAACI({
  name: ['五十鈴改二'],
  id: 14,
  fixed: 4,
  modifier: 1.45,
  shipValid: isIsuzuK2,
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAAGun), hasSome(isAARadar)),
})

declareAACI({
  name: ['五十鈴改二'],
  id: 15,
  fixed: 3,
  modifier: 1.3,
  shipValid: isIsuzuK2,
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAAGun)),
})

const isKasumiK2B = shipIdIs(470)

// id 16~17 Kasumi K2B
declareAACI({
  name: ['霞改二乙'],
  id: 16,
  fixed: 4,
  modifier: 1.4,
  shipValid: isKasumiK2B,
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAAGun), hasSome(isAARadar)),
})

declareAACI({
  name: ['霞改二乙'],
  id: 17,
  fixed: 2,
  modifier: 1.25,
  shipValid: isKasumiK2B,
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAAGun)),
})

const isSatsukiK2 = shipIdIs(418)

// id 18: Satsuki K2
declareAACI({
  name: ['皐月改二'],
  id: 18,
  fixed: 2,
  modifier: 1.2,
  shipValid: isSatsukiK2,
  equipsValid: validAll(hasSome(isCDMG)),
})

const isKinuK2 = shipIdIs(487)
// id 19~20: Kinu K2
// any HA with builtin AAFD will not work
declareAACI({
  name: ['鬼怒改二'],
  id: 19,
  fixed: 5,
  modifier: 1.45,
  shipValid: isKinuK2,
  equipsValid: validAll(
    validNot(hasSome(isBuiltinHighAngleMount)),
    hasSome(isHighAngleMount),
    hasSome(isCDMG),
  ),
})

declareAACI({
  name: ['鬼怒改二'],
  id: 20,
  fixed: 3,
  modifier: 1.25,
  shipValid: isKinuK2,
  equipsValid: validAll(hasSome(isCDMG)),
})

const isYuraK2 = shipIdIs(488)

// id 21: Yura K2
declareAACI({
  name: ['由良改二'],
  id: 21,
  fixed: 5,
  modifier: 1.45,
  shipValid: isYuraK2,
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAARadar)),
})

const isFumitsukiK2 = shipIdIs(548)

// id 22: Fumitsuki K2
declareAACI({
  name: ['文月改二'],
  id: 22,
  fixed: 2,
  modifier: 1.2,
  shipValid: isFumitsukiK2,
  equipsValid: validAll(hasSome(isCDMG)),
})

const isUIT25 = shipIdIs(539)
const isI504 = shipIdIs(530)

// id 23: UIT-25 & I-504
declareAACI({
  name: ['UIT-25', '伊504'],
  id: 23,
  fixed: 1,
  modifier: 1.05,
  shipValid: validAny(isUIT25, isI504),
  equipsValid: validAll(hasSome(validAll(isAAGun, validNot(isCDMG)))),
})

const isTenryuuK2 = shipIdIs(477)
const isTatsutaK2 = shipIdIs(478)

// id 24: Tenryuu K2 & Tatsuta K2
declareAACI({
  name: ['天龍改二', '龍田改二'],
  id: 24,
  fixed: 3,
  modifier: 1.25,
  shipValid: validAny(isTenryuuK2, isTatsutaK2),
  equipsValid: validAll(hasSome(validAll(isAAGun, validNot(isCDMG))), hasSome(isHighAngleMount)),
})

const isIseK = shipIdIs(82)
const isIseK2 = shipIdIs(553)
const isHyuuGaK = shipIdIs(88)
const isHyuuGaK2 = shipIdIs(554)
// 274: 12cm30連装噴進砲改二
const isRocketK2 = equipIdIs(274)

// id 25: Ise-class Kai
declareAACI({
  name: ['伊勢改', '伊勢改二', '日向改', '日向改二'],
  id: 25,
  fixed: 7,
  modifier: 1.55,
  shipValid: validAny(isIseK, isHyuuGaK, isIseK2, isHyuuGaK2),
  equipsValid: validAll(hasSome(isRocketK2), hasSome(isAARadar), hasSome(isType3Shell)),
})

const isMusashiK2 = shipIdIs(546)
const isYamatoK2 = validAny(shipIdIs(911), shipIdIs(916))
// 275: 10cm連装高角砲改+増設機銃
const isHighAngleMountGun = equipIdIs(275)

// id 26: Yamato K2 / Yamato K2 Heavy / Musashi K2
declareAACI({
  name: ['武蔵改二', '大和改二', '大和改二重'],
  id: 26,
  fixed: 6,
  modifier: 1.4,
  shipValid: validAny(isMusashiK2, isYamatoK2),
  equipsValid: validAll(hasSome(isHighAngleMountGun), hasSome(isAARadar)),
})

// id 27: Ooyodo Kai
const isOoyodoK = shipIdIs(321)
declareAACI({
  name: ['大淀改'],
  id: 27,
  fixed: 5,
  modifier: 1.55,
  shipValid: validAny(isOoyodoK),
  equipsValid: validAll(
    hasSome(isHighAngleMountGun),
    hasSome(isRocketK2),
    hasSome(isAARadar)
  ),
})

const isMusashiK = shipIdIs(148)

// id 28: Ise-class Kai & Musashi Kai/K2
declareAACI({
  name: ['伊勢改', '伊勢改二', '日向改', '日向改二', '武蔵改', '武蔵改二'],
  id: 28,
  fixed: 4,
  modifier: 1.4,
  shipValid: validAny(isIseK, isIseK2, isHyuuGaK, isHyuuGaK2, isMusashiK, isMusashiK2),
  equipsValid: validAll(hasSome(isRocketK2), hasSome(isAARadar)),
})

const isHamakazeBK = shipIdIs(558)
const isIsokazeBK = shipIdIs(557)

// id 29: Hamakaze B Kai & Isokaze B Kai
declareAACI({
  name: ['浜風乙改', '磯風乙改'],
  id: 29,
  fixed: 5,
  modifier: 1.55,
  shipValid: validAny(isHamakazeBK, isIsokazeBK),
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAARadar)),
})

const isGotlandKai = shipIdIs(579)

// id 30: Tenryuu K2 & Gotland Kai
declareAACI({
  name: ['天龍改二', 'Gotland改'],
  id: 30,
  fixed: 3,
  modifier: 1.3,
  shipValid: validAny(isTenryuuK2, isGotlandKai),
  equipsValid: hasAtLeast(isHighAngleMount, 3),
})

// id 31: Tenryuu K2
declareAACI({
  name: ['天龍改二'],
  id: 31,
  fixed: 2,
  modifier: 1.25,
  shipValid: isTenryuuK2,
  equipsValid: hasAtLeast(isHighAngleMount, 2),
})

// 67 = Queen Elizabeth class
// 78 = Ark Royal class
// 82 = J class
// 88 = Nelson class
// 108 = Town class
const isRoyalNavyShips = ship => [67, 78, 82, 88, 108].includes(ship.api_ctype)
// 6 = 金剛型
const isKongouClassK2 = ship => ship.api_ctype === 6 && ship.api_name.includes('改二')
// 191: QF 2ポンド8連装ポンポン砲
const isQF2Pounder = equipIdIs(191)
// 300: 16inch Mk.I三連装砲改+FCR type284
const is16InchMkITriplePlusFCR = equipIdIs(300)
// 301: 20連装7inch UP Rocket Launchers
const is20Tube7InchUpRocketLaunchers = equipIdIs(301)

// id 32: HMS & Kongou-class K2
declareAACI({
  name: ['HMS Royal Navy', '金剛改二', '比叡改二', '榛名改二', '霧島改二'],
  id: 32,
  fixed: 3,
  modifier: 1.2,
  shipValid: validAny(isRoyalNavyShips, isKongouClassK2),
  equipsValid: validAny(
    validAll(hasSome(is16InchMkITriplePlusFCR), hasSome(isQF2Pounder)),
    validAll(hasSome(is20Tube7InchUpRocketLaunchers), hasSome(isQF2Pounder)),
    hasAtLeast(is20Tube7InchUpRocketLaunchers, 2)
  ),
})

// id 33: Gotland Kai
declareAACI({
  name: ['Gotland改'],
  id: 33,
  fixed: 3,
  modifier: 1.35,
  shipValid: isGotlandKai,
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAAGun)),
})

const isFletcherClassOrKai = shipIdIsOneOf(
  // Johnston & Kai
  562, 689,

  // Fletcher & Kai & Mod.2 & Mk.II
  596, 692, 628, 629,

  // Heywood L.E. & Kai
  941, 726,
)

const is5InchSingleGunMountMk30PlusGFCS = equipIdIs(308)

// id 34~37: Johnston
declareAACI({
  name: ['Fletcher-class'],
  id: 34,
  fixed: 7,
  modifier: 1.6,
  shipValid: isFletcherClassOrKai,
  equipsValid: hasAtLeast(is5InchSingleGunMountMk30PlusGFCS, 2),
})

const is5InchSingleGunMountMk30OrKai = equip => (equip.api_slotitem_id === 284 || equip.api_slotitem_id === 313)
const is5InckSingleGunMountMk30Kai = equip => equip.apt_slotitem_id === 313

declareAACI({
  name: ['Fletcher-class'],
  id: 35,
  fixed: 6,
  modifier: 1.55,
  shipValid: isFletcherClassOrKai,
  equipsValid: validAll(
    hasSome(is5InchSingleGunMountMk30PlusGFCS),
    hasSome(is5InchSingleGunMountMk30OrKai),
  ),
})

const isGFCSMk37 = equipIdIs(307)

declareAACI({
  name: ['Fletcher-class'],
  id: 36,
  fixed: 6,
  modifier: 1.55,
  shipValid: isFletcherClassOrKai,
  equipsValid: validAll(hasAtLeast(is5InchSingleGunMountMk30OrKai, 2), hasSome(isGFCSMk37)),
})

declareAACI({
  name: ['Fletcher-class'],
  id: 37,
  fixed: 4,
  modifier: 1.45,
  shipValid: isFletcherClassOrKai,
  equipsValid: hasAtLeast(is5InckSingleGunMountMk30Kai, 2),
})

// id 38~41: Atlanta

// 597: Atlanta
// 696: Atlanta Kai
const isAtlantaOrKai = ship => [597, 696].includes(ship.api_ship_id)
// 362: 5inch連装両用砲(集中配備)
// 363: GFCS Mk.37+5inch連装両用砲(集中配備)
const isGFCSMk37And5InchTwinDualPurposeGunMount = equipIdIs(363)
const is5InchTwinDualPurposeGunMountLike = equip => [362, 363].includes(equip.api_slotitem_id)

declareAACI({
  name: ['Atlanta', 'Atlanta改'],
  id: 38,
  fixed: 10,
  modifier: 1.85,
  shipValid: isAtlantaOrKai,
  equipsValid:
    validAll(
      // 2 of GFCS Mk.37＋5inch連装両用砲(集中配備) must be equipped for this one
      hasAtLeast(isGFCSMk37And5InchTwinDualPurposeGunMount, 2),
    ),
})

// (as of Jan 1, 2020) Wikia listed this as Atlanta Kai's AACI and wikiwiki listed this as Atlanta's
// Applying to both Atlanta and Atlanta Kai since I'm seeing Atlanta trigering type 39.
declareAACI({
  name: ['Atlanta', 'Atlanta改'],
  id: 39,
  fixed: 10,
  modifier: 1.7,
  shipValid: isAtlantaOrKai,
  equipsValid:
    validAll(
      // GFCS Mk.37＋5inch連装両用砲(集中配備) must be equipped for this one
      hasSome(isGFCSMk37And5InchTwinDualPurposeGunMount),
      // And should have at least 2 in total, regardless of presence of GFCS radar.
      hasAtLeast(is5InchTwinDualPurposeGunMountLike, 2),
    ),
})

declareAACI({
  name: ['Atlanta', 'Atlanta改'],
  id: 40,
  fixed: 10,
  modifier: 1.7,
  shipValid: isAtlantaOrKai,
  equipsValid:
    validAll(
      hasSome(isGFCSMk37),
      hasAtLeast(is5InchTwinDualPurposeGunMountLike, 2),
    ),
})

declareAACI({
  name: ['Atlanta', 'Atlanta改'],
  id: 41,
  fixed: 9,
  modifier: 1.65,
  shipValid: isAtlantaOrKai,
  equipsValid: hasAtLeast(is5InchTwinDualPurposeGunMountLike, 2),
})

// id 42~45: Yamato K2 / Yamoto K2 Heavy / Musashi K2

// 464: 10cm連装高角砲群 集中配備
const is10cmTwinHighAngleGunMountConcentratedDeployment = equipIdIs(464)

// 142: 15m二重測距儀＋21号電探改二
// 460: 15m二重測距儀改＋21号電探改二＋熟練射撃指揮所
const is15mDuplexRangefinderLike = equip => [142, 460].includes(equip.api_slotitem_id)

// Anti-Air gun that has 9￼AA stat or higher.
const isAAMG = equip => isMachineGun(equip) && equip.api_tyku >= 6

declareAACI({
  name: ['武蔵改二', '大和改二', '大和改二重'],
  id: 42,
  fixed: 10,
  modifier: 1.65,
  shipValid: validAny(isMusashiK2, isYamatoK2),
  equipsValid: validAll(
    hasAtLeast(is10cmTwinHighAngleGunMountConcentratedDeployment, 2),
    hasSome(is15mDuplexRangefinderLike),
    hasSome(isAAMG),
  ),
})

declareAACI({
  name: ['武蔵改二', '大和改二', '大和改二重'],
  id: 43,
  fixed: 8,
  modifier: 1.6,
  shipValid: validAny(isMusashiK2, isYamatoK2),
  equipsValid: validAll(
    hasAtLeast(is10cmTwinHighAngleGunMountConcentratedDeployment, 2),
    hasSome(is15mDuplexRangefinderLike),
  ),
})

declareAACI({
  name: ['武蔵改二', '大和改二', '大和改二重'],
  id: 44,
  fixed: 6,
  modifier: 1.6,
  shipValid: validAny(isMusashiK2, isYamatoK2),
  equipsValid: validAll(
    hasSome(is10cmTwinHighAngleGunMountConcentratedDeployment),
    hasSome(is15mDuplexRangefinderLike),
    hasSome(isAAMG),
  ),
})

declareAACI({
  name: ['武蔵改二', '大和改二', '大和改二重'],
  id: 45,
  fixed: 5,
  modifier: 1.55,
  shipValid: validAny(isMusashiK2, isYamatoK2),
  equipsValid: validAll(
    hasSome(is10cmTwinHighAngleGunMountConcentratedDeployment),
    hasSome(is15mDuplexRangefinderLike),
  ),
})

// id 46: Haruna Kai Ni B

const isHarunaKaiNiB = shipIdIs(593)
// 502: 35.6cm連装砲改三(ダズル迷彩仕様)
const is356mmTwinMountKai3Dazzle = equipIdIs(502)
// 503: 35.6cm連装砲改四
const is356mmTwinMountKai4 = equipIdIs(503)

declareAACI({
  name: ['榛名改二乙'],
  id: 46,
  fixed: 8,
  modifier: 1.55,
  shipValid: validAny(isHarunaKaiNiB),
  equipsValid: validAll(
    hasSome(isCDMG),
    hasSome(isAARadar),
    hasSome(validAny(is356mmTwinMountKai3Dazzle, is356mmTwinMountKai4)),
  ),
})

// id 47: Shiratsuyu Class Kai 2

const isShiratsuyuClassK2 = validAny(
  shipIdIs(497),
  shipIdIs(145),
  shipIdIs(961),
  shipIdIs(498),
  shipIdIs(975),
)
// 529: 12.7cm連装砲C型改三H
const is127mmTwinMountTypeCKai3H = equipIdIs(529)
// 505: 25mm対空機銃増備
const is25mmAAGunExtraEmplacement = equipIdIs(505)

declareAACI({
  name: ['白露改二', '時雨改二', '時雨改三', '村雨改二', '春雨改二'],
  id: 47,
  fixed: 2,
  modifier: 1.3,
  shipValid: validAny(isShiratsuyuClassK2),
  equipsValid: validAny(
    validAll(
      hasSome(is127mmTwinMountTypeCKai3H),
      hasSome(validAny(is25mmAAGunExtraEmplacement, isAdvancedAARadar)),
    ),
    hasAtLeast(is127mmTwinMountTypeCKai3H, 2),
  ),
})

// id 48: Akizuki Class Kai / Kai 2

// 533: 10cm連装高角砲改＋高射装置改
const is100mmTwinMountKaiAAFD = equipIdIs(533)

declareAACI({
  name: ['Akizuki Class Kai', 'Akizuki Class Kai 2'],
  id: 48,
  fixed: 8,
  modifier: 1.75,
  shipValid: validAny(
    validAll(
      isAkizukiClass,
      isKai,
    )
  ),
  equipsValid: validAny(
    validAll(
      hasAtLeast(is100mmTwinMountKaiAAFD, 2),
      hasSome(isAdvancedAARadar),
    ),
  ),
})

// id 49: Fujinami Kai Ni / Fubuki Kai Ni / Shirayuki Kai Ni

const isFujinamiK2 = shipIdIs(981)
const isFubukiK2 = shipIdIs(426)
const isShirayukiK2 = shipIdIs(986)

declareAACI({
  name: ['藤波改二', '吹雪改二', '白雪改二'],
  id: 49,
  fixed: 5,
  modifier: 1.5,
  shipValid: validAny(
    isFujinamiK2,
    isFubukiK2,
    isShirayukiK2,
  ),
  equipsValid: validAny(
    validAll(
      hasAtLeast(isBuiltinHighAngleMount, 2),
      hasSome(isAdvancedAARadar),
    ),
  ),
})

// id 50: Fujinami Kai Ni / Fubuki Kai Ni / Shirayuki Kai Ni / Akizuki Class

const isType94AAFD = equipIdIs(121)
const is100mmTwinMountKai = equipIdIs(553)
const is100mmTwinMountKaiOrAAFD = validAny(
  is100mmTwinMountKaiAAFD,
  is100mmTwinMountKai,
)

declareAACI({
  name: ['藤波改二', '吹雪改二', '白雪改二', 'Akizuki Class'],
  id: 50,
  fixed: 7,
  modifier: 1.5,
  shipValid: validAny(
    isFujinamiK2,
    isFubukiK2,
    isShirayukiK2,
    isAkizukiClass,
  ),
  equipsValid: validAny(
    validAll(
      hasAtLeast(is100mmTwinMountKaiOrAAFD, 2),
      hasSome(isAdvancedAARadar),
      hasSome(isType94AAFD),
    ),
  ),
})

// id 51~52: Fujinami Kai Ni / Fubuki Kai Ni / Shirayuki Kai Ni

declareAACI({
  name: ['藤波改二', '吹雪改二', '白雪改二'],
  id: 51,
  fixed: 5,
  modifier: 1.35,
  shipValid: validAny(
    isFujinamiK2,
    isFubukiK2,
    isShirayukiK2,
  ),
  equipsValid: validAny(
    validAll(
      hasSome(is100mmTwinMountKaiOrAAFD),
      hasSome(isAdvancedAARadar),
      hasSome(isAAGun),
    ),
  ),
})

declareAACI({
  name: ['藤波改二', '吹雪改二', '白雪改二'],
  id: 52,
  fixed: 4,
  modifier: 1.4,
  shipValid: validAny(
    isFujinamiK2,
    isFubukiK2,
    isShirayukiK2,
  ),
  equipsValid: validAny(
    validAll(
      hasAtLeast(is100mmTwinMountKai, 2),
      hasSome(isType94AAFD),
    ),
  ),
})

// return: a list of sorted AACI objects order by effect desc,
//   as most effective AACI gets priority to be triggered.
// param: AACI IDs from possibleAACIs functions
// param: a optional sorting callback to customize ordering
const sortAaciIds = (
  aaciIds,
  sortCallback = (a, b) => b.fixed - a.fixed || b.modifier - a.modifier,
) => {
  let aaciList = []
  if (!!aaciIds && Array.isArray(aaciIds)) {
    aaciIds.forEach(id => {
      if (AACITable[id]) {
        aaciList.push(AACITable[id])
      }
    })
    aaciList = aaciList.sort(sortCallback)
  }
  return aaciList
}

// Order by AACI id desc
export const sortFleetPossibleAaciList = triggeredShipAaciIds =>
  sortAaciIds(triggeredShipAaciIds, (a, b) => b.id - a.id)

// return a list of AACIs that meet the requirement of ship and equipmenmt
// ship: ship
// equips: [[equip, onslot] for equip on ship]
export const getShipAvailableAACIs = (ship, equips) =>
  Object.keys(AACITable)
    .filter(key => {
      const type = AACITable[key]
      return type.shipValid(ship) && type.equipsValid(equips)
    })
    .map(key => Number(key))

// return a list of all possible AACIs for the ship herself
export const getShipAllAACIs = ship =>
  Object.keys(AACITable)
    .filter(key => {
      const type = AACITable[key]
      return type.shipValid(ship)
    })
    .map(key => Number(key))

// return the AACIs to trigger for a ship, it will be array due to exceptions
export const getShipAACIs = (ship, equips) => {
  const AACIs = getShipAvailableAACIs(ship, equips)
  const maxFixed = maxBy(AACIs, id => (AACITable[id] || {}).fixed || 0) || 0
  // Kinu kai 2 exception
  if (AACIs.includes(19)) {
    return [19, 20]
  }
  if (maxFixed === 8 && AACIs.includes(20)) {
    return [8, 20]
  }
  if (maxFixed === 8 && AACIs.includes(7)) {
    return [7, 8]
  }
  // Kasumi Kai 2 B since 17 and 9 have same shotdown
  if (AACIs.includes(17) && maxFixed === 9) {
    return [17]
  }
  // Isuzu Kai 2 since 14 and 8 have same shotdown
  if (AACIs.includes(14) && maxFixed === 8) {
    return [14]
  }
  // Satsuki Kai 2
  if (AACIs.includes(18)) {
    return [...new Set([maxFixed, 18])]
  }
  // Fumitsuki Kai 2, not verified, only assumption
  if (AACIs.includes(22)) {
    return [...new Set([maxFixed, 22])]
  }

  return maxFixed ? [maxFixed] : []
}

// collections of AACIs to trigger of each ship
export const getFleetAvailableAACIs = (ships, equips) => {
  const aaciSet = {}
  ships.forEach((ship, index) => {
    getShipAACIs(
      ship,
      equips[index].map(([equip, onslot]) => equip),
    ).forEach(id => {
      aaciSet[id] = true
    })
  })
  return Object.keys(aaciSet).map(key => Number(key))
}
