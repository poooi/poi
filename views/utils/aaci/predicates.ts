// Ship and equipment predicates shared by the AACI rule entries ('./entries').
// All predicates are pure; comments give the in-game meaning of the magic ids.
import type { GameEquip, GameShip, EquipsPredicate } from './types'

// *** Combinators ***

// check for $slotitemtypes
export const itemTypeIs = (n: number) => (equip: GameEquip) => equip.api_type?.[2] === n

// type for slot item
export const iconIs = (n: number) => (equip: GameEquip) => equip.api_type?.[3] === n

// validAll(f,g...)(x) = f(x) && g(x) && ...
export const validAll =
  (...func: EquipsPredicate[]) =>
  (x: GameEquip[]) =>
    func.every((f) => f(x))
export const validNot = (f: EquipsPredicate) => (x: GameEquip[]) => !f(x)
export const validAny =
  (...func: EquipsPredicate[]) =>
  (x: GameEquip[]) =>
    func.some((f) => f(x))

export const shipIdIs = (n: number) => (ship: GameShip) => ship.api_ship_id === n
export const equipIdIs = (n: number) => (equip: GameEquip) => equip.api_slotitem_id === n
export const shipIdIsOneOf =
  (...shipIds: number[]) =>
  (ship: GameShip) =>
    shipIds.includes(ship.api_ship_id ?? -1)
export const isKai = (ship: GameShip) => ship.api_getmes === '<br>'

// "hasAtLeast(pred)(n)(xs)" is the same as:
// xs.filter(pred).length >= n
export const hasAtLeast = (pred: (e: GameEquip) => boolean, n: number) => (xs: GameEquip[]) =>
  xs.filter(pred).length >= n

// "hasSome(pred)(xs)" is the same as:
// xs.some(pred)
export const hasSome = (pred: (e: GameEquip) => boolean) => (xs: GameEquip[]) => xs.some(pred)

// check if slot num of ship (excluding ex slot) equals or greater
export const slotNumAtLeast = (n: number) => (ship: GameShip) => (ship.api_slot_num ?? 0) >= n

// *** Ship predicates ***

// 54 = 秋月型
export const isAkizukiClass = (ship: GameShip) => ship.api_ctype === 54

// shipId 426: Fubuki K2, 1035: Fubuki K3, 1040: Fubuki K3 Go
export const isFubukiK2 = shipIdIs(426)
export const isFubukiK3 = shipIdIs(1035)
export const isFubukiK3Go = shipIdIs(1040)

export const isBattleship = (ship: GameShip) => [8, 9, 10].includes(ship.api_stype ?? -1)
export const isNotSubmarine = (ship: GameShip) => ![13, 14].includes(ship.api_stype ?? -1)

export const isMayaK2 = shipIdIs(428)
export const isIsuzuK2 = shipIdIs(141)
export const isKasumiK2B = shipIdIs(470)
export const isYuubariK2 = shipIdIs(622)
export const isInagiK2 = shipIdIs(979)
export const isSatsukiK2 = shipIdIs(418)
export const isKinuK2 = shipIdIs(487)
export const isYuraK2 = shipIdIs(488)
export const isFumitsukiK2 = shipIdIs(548)
export const isUIT25 = shipIdIs(539)
export const isI504 = shipIdIs(530)
export const isTenryuuK2 = shipIdIs(477)
export const isTatsutaK2 = shipIdIs(478)
export const isIseK = shipIdIs(82)
export const isIseK2 = shipIdIs(553)
export const isHyuuGaK = shipIdIs(88)
export const isHyuuGaK2 = shipIdIs(554)
export const isMusashiK = shipIdIs(148)
export const isMusashiK2 = shipIdIs(546)
export const isYamatoK2 = (ship: GameShip) => shipIdIs(911)(ship) || shipIdIs(916)(ship)
export const isOoyodoK = shipIdIs(321)
export const isHiryuuK3 = shipIdIs(1031)
export const isHamakazeBK = shipIdIs(558)
export const isIsokazeBK = shipIdIs(557)
export const isGotlandKai = shipIdIs(579)

// 67 = Queen Elizabeth class
// 78 = Ark Royal class
// 82 = J class
// 88 = Nelson class
// 108 = Town class
export const isRoyalNavyShips = (ship: GameShip) =>
  [67, 78, 82, 88, 108].includes(ship.api_ctype ?? -1)
// 6 = 金剛型
export const isKongouClassK2 = (ship: GameShip) =>
  ship.api_ctype === 6 && (ship.api_name ?? '').includes('改二')

export const isFletcherClassOrKai = shipIdIsOneOf(
  // Johnston & Kai
  562,
  689,
  // Fletcher & Kai & Mod.2 & Mk.II
  596,
  692,
  628,
  629,
  // Heywood L.E. & Kai
  941,
  726,
)

// 597: Atlanta
// 696: Atlanta Kai
export const isAtlantaOrKai = (ship: GameShip) => [597, 696].includes(ship.api_ship_id ?? -1)

export const isHarunaKaiNiB = shipIdIs(593)

export const isShiratsuyuClassK2 = (ship: GameShip) =>
  [497, 145, 961, 498, 975].includes(ship.api_ship_id ?? -1)

export const isFujinamiK2 = shipIdIs(981)
export const isHayanamiK2 = shipIdIs(982)
export const isHamanamiK2 = shipIdIs(983)
export const isTamananiK2 = shipIdIs(1033)
export const isShirayukiK2 = shipIdIs(986)
export const isHatsuyukiK2 = shipIdIs(987)

// *** Equipment predicates ***

// icon=16: 高角砲
export const isHighAngleMount = iconIs(16)
// 12: 小型電探
// 13: 大型電探
export const isRadar = (equip: GameEquip) => itemTypeIs(12)(equip) || itemTypeIs(13)(equip)
// 3: 大口径主砲
export const isLargeCaliberMainGun = itemTypeIs(3)
// 18: 対空強化弾
export const isType3Shell = itemTypeIs(18)
// 36: 高射装置 Anti-aircraft Fire Director
export const isAAFD = itemTypeIs(36)
// AA Radar
// Surface Radar are excluded by checking whether
// the equipment gives AA stat (api_tyku)
export const isAARadar = (equip: GameEquip) => isRadar(equip) && (equip.api_tyku ?? 0) > 0
export const isAdvancedAARadar = (equip: GameEquip) => isRadar(equip) && (equip.api_tyku ?? 0) >= 4
// ref wikia: "Built-in HA mount is defined as a single High-Angle gun that has 8 AA stat or higher."
// (as of Jan 1, 2020)
export const isBuiltinHighAngleMount = (equip: GameEquip) =>
  isHighAngleMount(equip) && (equip.api_tyku ?? 0) >= 8

// 21=対空機銃
export const isMachineGun = itemTypeIs(21)
// ref wikia: "CDMG is defined as any Anti-Air gun that has 9 AA stat or higher."
export const isCDMG = (equip: GameEquip) => isMachineGun(equip) && (equip.api_tyku ?? 0) >= 9
// 21: 対空機銃
export const isAAGun = itemTypeIs(21)
// Anti-Air gun that has 6+ AA stat
export const isAAMG = (equip: GameEquip) => isMachineGun(equip) && (equip.api_tyku ?? 0) >= 6

// 274: 12cm30連装噴進砲改二
export const isRocketK2 = equipIdIs(274)
// 275: 10cm連装高角砲改+増設機銃
export const isHighAngleMountGun = equipIdIs(275)
// 71: 10cm連装高角砲(砲架), 220: 8cm高角砲改+増設機銃
export const is10cmTwinHAGunMountBase = equipIdIs(71)
export const is8cmHAMountKaiExtra = equipIdIs(220)
// 191: QF 2ポンド8連装ポンポン砲
export const isQF2Pounder = equipIdIs(191)
// 300: 16inch Mk.I三連装砲改+FCR type284
export const is16InchMkITriplePlusFCR = equipIdIs(300)
// 301: 20連装7inch UP Rocket Launchers
export const is20Tube7InchUpRocketLaunchers = equipIdIs(301)

export const is5InchSingleGunMountMk30PlusGFCS = equipIdIs(308)
export const is5InchSingleGunMountMk30OrKai = (equip: GameEquip) =>
  equip.api_slotitem_id === 284 || equip.api_slotitem_id === 313
export const is5InckSingleGunMountMk30Kai = (equip: GameEquip) => equip.api_slotitem_id === 313
export const isGFCSMk37 = equipIdIs(307)

// 362: 5inch連装両用砲(集中配備)
// 363: GFCS Mk.37+5inch連装両用砲(集中配備)
export const isGFCSMk37And5InchTwinDualPurposeGunMount = equipIdIs(363)
export const is5InchTwinDualPurposeGunMountLike = (equip: GameEquip) =>
  equip.api_slotitem_id === 362 || equip.api_slotitem_id === 363

// 464: 10cm連装高角砲群 集中配備
export const is10cmTwinHighAngleGunMountConcentratedDeployment = equipIdIs(464)
// 142: 15m二重測距儀＋21号電探改二
// 460: 15m二重測距儀改＋21号電探改二＋熟練射撃指揮所
export const is15mDuplexRangefinderLike = (equip: GameEquip) =>
  equip.api_slotitem_id === 142 || equip.api_slotitem_id === 460

// 502: 35.6cm連装砲改三(ダズル迷彩仕様)
export const is356mmTwinMountKai3Dazzle = equipIdIs(502)
// 503: 35.6cm連装砲改四
export const is356mmTwinMountKai4 = equipIdIs(503)

// 529: 12.7cm連装砲C型改三H
export const is127mmTwinMountTypeCKai3H = equipIdIs(529)
// 505: 25mm対空機銃増備
export const is25mmAAGunExtraEmplacement = equipIdIs(505)

// 533: 10cm連装高角砲改＋高射装置改
export const is100mmTwinMountKaiAAFD = equipIdIs(533)
export const isType94AAFD = equipIdIs(121)
export const is100mmTwinMountKai = equipIdIs(553)
export const is100mmTwinMountKaiOrAAFD = (equip: GameEquip) =>
  is100mmTwinMountKaiAAFD(equip) || is100mmTwinMountKai(equip)
