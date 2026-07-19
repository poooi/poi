// Named equipment predicates shared by the combat mechanics modules
// (AACI, AAPB, OASW, special attacks).
// All predicates are pure; comments give the in-game meaning of the magic ids.
import type { GameEquip } from './types'

import { equipIdIs, iconIs, itemTypeIs } from './combinators'

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

// *** Aircraft / ASW equipment ***

// 17: 爆雷投射機/爆雷
export const isDepthCharge = iconIs(17)
// 18: ソナー
export const isSonar = iconIs(18)
// 7: 艦上爆撃機
export const isDiveBomber = itemTypeIs(7)
// 8: 艦上攻撃機
export const isTorpedoBomber = itemTypeIs(8)
// 11: 水上爆撃機
export const isSeaplaneBomber = itemTypeIs(11)
// 25: オートジャイロ (e.g. カ号観測機)
export const isAutogyro = itemTypeIs(25)
// 26: 対潜哨戒機 (e.g. 三式指揮連絡機(対潜))
export const isFixedWingASWAircraft = itemTypeIs(26)
export const isASWAircraft = (equip: GameEquip) =>
  isFixedWingASWAircraft(equip) || isAutogyro(equip)

// equipment's own ASW stat
export const equipTais = (equip: GameEquip) => equip.api_tais ?? 0
export const equipTaisAbove = (value: number) => (equip: GameEquip) => equipTais(equip) >= value
