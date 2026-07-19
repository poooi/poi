// Named ship predicates shared by the combat mechanics modules
// (AACI, AAPB, OASW, special attacks).
// Comments give the in-game meaning of the magic ids.
import type { GameShip } from './types'

import { ctypeIs, shipIdIs, shipIdIsOneOf } from './combinators'

export const isKai = (ship: GameShip) => ship.api_getmes === '<br>'

// 54 = 秋月型
export const isAkizukiClass = ctypeIs(54)

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
