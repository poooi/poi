/*

   AACI rule entries. Importing this module populates AACITable (side effect).
   Registration order does not matter: consumers sort by fixed/modifier/id at
   query time (see './api').

   reference:

   - https://wikiwiki.jp/kancolle/航空戦#antiairfire (as of Jan 23, 2019)
   - https://kancolle.fandom.com/wiki/Combat/Aerial_Combat (as of Jan 1, 2020)
   - https://github.com/andanteyk/ElectronicObserver/blob/master/ElectronicObserver/Other/Information/apilist.txt (as of Jan 1, 2019)

 */
import {
  hasAtLeast,
  hasSome,
  is100mmTwinMountKai,
  is100mmTwinMountKaiAAFD,
  is100mmTwinMountKaiOrAAFD,
  is10cmTwinHAGunMountBase,
  is10cmTwinHighAngleGunMountConcentratedDeployment,
  is127mmTwinMountTypeCKai3H,
  is15mDuplexRangefinderLike,
  is16InchMkITriplePlusFCR,
  is20Tube7InchUpRocketLaunchers,
  is25mmAAGunExtraEmplacement,
  is356mmTwinMountKai3Dazzle,
  is356mmTwinMountKai4,
  is5InchSingleGunMountMk30OrKai,
  is5InchSingleGunMountMk30PlusGFCS,
  is5InchTwinDualPurposeGunMountLike,
  is5InckSingleGunMountMk30Kai,
  is8cmHAMountKaiExtra,
  isAAFD,
  isAAGun,
  isAAMG,
  isAARadar,
  isAdvancedAARadar,
  isAkizukiClass,
  isAtlantaOrKai,
  isBattleship,
  isBuiltinHighAngleMount,
  isCDMG,
  isFletcherClassOrKai,
  isFubukiK2,
  isFubukiK3,
  isFubukiK3Go,
  isFujinamiK2,
  isFumitsukiK2,
  isGFCSMk37,
  isGFCSMk37And5InchTwinDualPurposeGunMount,
  isGotlandKai,
  isHamakazeBK,
  isHamanamiK2,
  isHarunaKaiNiB,
  isHatsuyukiK2,
  isHayanamiK2,
  isHighAngleMount,
  isHighAngleMountGun,
  isHiryuuK3,
  isHyuuGaK,
  isHyuuGaK2,
  isI504,
  isInagiK2,
  isIseK,
  isIseK2,
  isIsokazeBK,
  isIsuzuK2,
  isKai,
  isKasumiK2B,
  isKinuK2,
  isKongouClassK2,
  isLargeCaliberMainGun,
  isMayaK2,
  isMusashiK,
  isMusashiK2,
  isNotSubmarine,
  isOoyodoK,
  isQF2Pounder,
  isRadar,
  isRocketK2,
  isRoyalNavyShips,
  isSatsukiK2,
  isShiratsuyuClassK2,
  isShirayukiK2,
  isTamananiK2,
  isTatsutaK2,
  isTenryuuK2,
  isType3Shell,
  isType94AAFD,
  isUIT25,
  isYamatoK2,
  isYuraK2,
  isYuubariK2,
  slotNumAtLeast,
  validAll,
  validAny,
  validNot,
} from '../predicates'
import { declareAACI } from './table'

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
  name: ['Akizuki Class', '吹雪改三護(六式)'],
  id: 2,
  fixed: 6,
  modifier: 1.7,
  shipValid: (ship) => isAkizukiClass(ship) || isFubukiK3Go(ship),
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

// id 4: battleships
declareAACI({
  name: ['Battle Ship'],
  id: 4,
  fixed: 6,
  modifier: 1.5,
  shipValid: (ship) => isBattleship(ship) && slotNumAtLeast(4)(ship),
  equipsValid: validAll(
    hasSome(isLargeCaliberMainGun),
    hasSome(isType3Shell),
    hasSome(isAAFD),
    hasSome(isAARadar),
  ),
})

// id 5: all surface ships
declareAACI({
  id: 5,
  fixed: 4,
  modifier: 1.5,
  shipValid: (ship) => isNotSubmarine(ship) && slotNumAtLeast(3)(ship),
  equipsValid: validAll(hasAtLeast(isBuiltinHighAngleMount, 2), hasSome(isAARadar)),
})

// id 6: battleships
declareAACI({
  name: ['Battle Ship'],
  id: 6,
  fixed: 4,
  modifier: 1.45,
  shipValid: (ship) => isBattleship(ship) && slotNumAtLeast(3)(ship),
  equipsValid: validAll(hasSome(isLargeCaliberMainGun), hasSome(isType3Shell), hasSome(isAAFD)),
})

// id 7~9: all surface ships
declareAACI({
  id: 7,
  fixed: 3,
  modifier: 1.35,
  shipValid: (ship) => isNotSubmarine(ship) && slotNumAtLeast(3)(ship),
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAAFD), hasSome(isAARadar)),
})

declareAACI({
  id: 8,
  fixed: 4,
  modifier: 1.4,
  shipValid: (ship) => isNotSubmarine(ship) && slotNumAtLeast(2)(ship),
  equipsValid: validAll(hasSome(isBuiltinHighAngleMount), hasSome(isAARadar)),
})

declareAACI({
  id: 9,
  fixed: 2,
  modifier: 1.3,
  shipValid: (ship) => isNotSubmarine(ship) && slotNumAtLeast(2)(ship),
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAAFD)),
})

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

declareAACI({
  id: 12,
  fixed: 3,
  modifier: 1.25,
  shipValid: (ship) => isNotSubmarine(ship) && slotNumAtLeast(3)(ship),
  equipsValid: validAll(hasSome(isCDMG), hasAtLeast(isAAGun, 2), hasSome(isAARadar)),
})

// id 13: all surface ships
declareAACI({
  id: 13,
  fixed: 4,
  modifier: 1.35,
  shipValid: (ship) => isNotSubmarine(ship) && slotNumAtLeast(3)(ship),
  equipsValid: validAll(hasSome(isBuiltinHighAngleMount), hasSome(isCDMG), hasSome(isAARadar)),
})

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
  name: ['五十鈴改二', '吹雪改三'],
  id: 15,
  fixed: 3,
  modifier: 1.3,
  shipValid: (ship) => isIsuzuK2(ship) || isFubukiK3(ship),
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAAGun)),
})

// id 16~17 Kasumi K2B
declareAACI({
  name: ['霞改二乙', '夕張改二', '吹雪改三'],
  id: 16,
  fixed: 4,
  modifier: 1.4,
  shipValid: (ship) => isKasumiK2B(ship) || isYuubariK2(ship) || isFubukiK3(ship),
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAAGun), hasSome(isAARadar)),
})

declareAACI({
  name: ['霞改二乙', '稲木改二'],
  id: 17,
  fixed: 2,
  modifier: 1.25,
  shipValid: (ship) => isKasumiK2B(ship) || isInagiK2(ship),
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAAGun)),
})

// id 18: Satsuki K2
declareAACI({
  name: ['皐月改二'],
  id: 18,
  fixed: 2,
  modifier: 1.2,
  shipValid: isSatsukiK2,
  equipsValid: validAll(hasSome(isCDMG)),
})

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

// id 21: Yura K2
declareAACI({
  name: ['由良改二', '吹雪改三', '吹雪改三護(六式)'],
  id: 21,
  fixed: 5,
  modifier: 1.45,
  shipValid: (ship) => isYuraK2(ship) || isFubukiK3(ship) || isFubukiK3Go(ship),
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAARadar)),
})

// id 22: Fumitsuki K2
declareAACI({
  name: ['文月改二'],
  id: 22,
  fixed: 2,
  modifier: 1.2,
  shipValid: isFumitsukiK2,
  equipsValid: validAll(hasSome(isCDMG)),
})

// id 23: UIT-25 & I-504
declareAACI({
  name: ['UIT-25', '伊504'],
  id: 23,
  fixed: 1,
  modifier: 1.05,
  shipValid: (ship) => isUIT25(ship) || isI504(ship),
  equipsValid: validAll(hasSome((e) => isAAGun(e) && !isCDMG(e))),
})

// id 24: Tenryuu K2 & Tatsuta K2
declareAACI({
  name: ['天龍改二', '龍田改二', '吹雪改三'],
  id: 24,
  fixed: 3,
  modifier: 1.25,
  shipValid: (ship) => isTenryuuK2(ship) || isTatsutaK2(ship) || isFubukiK3(ship),
  equipsValid: validAll(
    hasSome((e) => isAAGun(e) && !isCDMG(e)),
    hasSome(isHighAngleMount),
  ),
})

// id 25: Ise-class Kai
declareAACI({
  name: ['伊勢改', '伊勢改二', '日向改', '日向改二'],
  id: 25,
  fixed: 7,
  modifier: 1.55,
  shipValid: (ship) => isIseK(ship) || isHyuuGaK(ship) || isIseK2(ship) || isHyuuGaK2(ship),
  equipsValid: validAll(hasSome(isRocketK2), hasSome(isAARadar), hasSome(isType3Shell)),
})

// id 26: Yamato K2 / Yamato K2 Heavy / Musashi K2
declareAACI({
  name: ['武蔵改二', '大和改二', '大和改二重'],
  id: 26,
  fixed: 6,
  modifier: 1.4,
  shipValid: (ship) => isMusashiK2(ship) || isYamatoK2(ship),
  equipsValid: validAll(hasSome(isHighAngleMountGun), hasSome(isAARadar)),
})

// id 27: Ooyodo Kai / Hiryuu K3
declareAACI({
  name: ['大淀改', '飛龍改三'],
  id: 27,
  fixed: 5,
  modifier: 1.55,
  shipValid: (ship) => isOoyodoK(ship) || isHiryuuK3(ship),
  equipsValid: validAll(
    hasSome(
      (e) => isHighAngleMountGun(e) || is10cmTwinHAGunMountBase(e) || is8cmHAMountKaiExtra(e),
    ),
    hasSome(isRocketK2),
    hasSome(isAARadar),
  ),
})

// id 28: Ise-class Kai & Musashi Kai/K2
declareAACI({
  name: ['伊勢改', '伊勢改二', '日向改', '日向改二', '武蔵改', '武蔵改二'],
  id: 28,
  fixed: 4,
  modifier: 1.4,
  shipValid: (ship) =>
    isIseK(ship) ||
    isIseK2(ship) ||
    isHyuuGaK(ship) ||
    isHyuuGaK2(ship) ||
    isMusashiK(ship) ||
    isMusashiK2(ship),
  equipsValid: validAll(hasSome(isRocketK2), hasSome(isAARadar)),
})

// id 29: Hamakaze B Kai & Isokaze B Kai
declareAACI({
  name: ['浜風乙改', '磯風乙改'],
  id: 29,
  fixed: 5,
  modifier: 1.55,
  shipValid: (ship) => isHamakazeBK(ship) || isIsokazeBK(ship),
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAARadar)),
})

// id 30: Tenryuu K2 & Gotland Kai
declareAACI({
  name: ['天龍改二', 'Gotland改'],
  id: 30,
  fixed: 3,
  modifier: 1.3,
  shipValid: (ship) => isTenryuuK2(ship) || isGotlandKai(ship),
  equipsValid: hasAtLeast(isHighAngleMount, 3),
})

// id 31: Tenryuu K2 / Inagi K2
declareAACI({
  name: ['天龍改二', '稲木改二'],
  id: 31,
  fixed: 2,
  modifier: 1.25,
  shipValid: (ship) => isTenryuuK2(ship) || isInagiK2(ship),
  equipsValid: hasAtLeast(isHighAngleMount, 2),
})

// id 32: HMS & Kongou-class K2
declareAACI({
  name: ['HMS Royal Navy', '金剛改二', '比叡改二', '榛名改二', '霧島改二'],
  id: 32,
  fixed: 3,
  modifier: 1.2,
  shipValid: (ship) => isRoyalNavyShips(ship) || isKongouClassK2(ship),
  equipsValid: validAny(
    validAll(hasSome(is16InchMkITriplePlusFCR), hasSome(isQF2Pounder)),
    validAll(hasSome(is20Tube7InchUpRocketLaunchers), hasSome(isQF2Pounder)),
    hasAtLeast(is20Tube7InchUpRocketLaunchers, 2),
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

// id 34~37: Johnston
declareAACI({
  name: ['Fletcher-class', '吹雪改三護(六式)'],
  id: 34,
  fixed: 7,
  modifier: 1.6,
  shipValid: (ship) => isFletcherClassOrKai(ship) || isFubukiK3Go(ship),
  equipsValid: hasAtLeast(is5InchSingleGunMountMk30PlusGFCS, 2),
})

declareAACI({
  name: ['Fletcher-class', '吹雪改三護(六式)'],
  id: 35,
  fixed: 6,
  modifier: 1.55,
  shipValid: (ship) => isFletcherClassOrKai(ship) || isFubukiK3Go(ship),
  equipsValid: validAll(
    hasSome(is5InchSingleGunMountMk30PlusGFCS),
    hasSome(is5InchSingleGunMountMk30OrKai),
  ),
})

declareAACI({
  name: ['Fletcher-class', '吹雪改三護(六式)'],
  id: 36,
  fixed: 6,
  modifier: 1.55,
  shipValid: (ship) => isFletcherClassOrKai(ship) || isFubukiK3Go(ship),
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
declareAACI({
  name: ['Atlanta', 'Atlanta改'],
  id: 38,
  fixed: 10,
  modifier: 1.85,
  shipValid: isAtlantaOrKai,
  equipsValid: validAll(hasAtLeast(isGFCSMk37And5InchTwinDualPurposeGunMount, 2)),
})

// (as of Jan 1, 2020) Wikia listed this as Atlanta Kai's AACI and wikiwiki listed this as Atlanta's
// Applying to both Atlanta and Atlanta Kai since I'm seeing Atlanta trigering type 39.
declareAACI({
  name: ['Atlanta', 'Atlanta改'],
  id: 39,
  fixed: 10,
  modifier: 1.7,
  shipValid: isAtlantaOrKai,
  equipsValid: validAll(
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
  equipsValid: validAll(hasSome(isGFCSMk37), hasAtLeast(is5InchTwinDualPurposeGunMountLike, 2)),
})

declareAACI({
  name: ['Atlanta', 'Atlanta改'],
  id: 41,
  fixed: 9,
  modifier: 1.65,
  shipValid: isAtlantaOrKai,
  equipsValid: hasAtLeast(is5InchTwinDualPurposeGunMountLike, 2),
})

// id 42~45: Yamato K2 / Yamato K2 Heavy / Musashi K2
declareAACI({
  name: ['武蔵改二', '大和改二', '大和改二重'],
  id: 42,
  fixed: 10,
  modifier: 1.65,
  shipValid: (ship) => isMusashiK2(ship) || isYamatoK2(ship),
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
  shipValid: (ship) => isMusashiK2(ship) || isYamatoK2(ship),
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
  shipValid: (ship) => isMusashiK2(ship) || isYamatoK2(ship),
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
  shipValid: (ship) => isMusashiK2(ship) || isYamatoK2(ship),
  equipsValid: validAll(
    hasSome(is10cmTwinHighAngleGunMountConcentratedDeployment),
    hasSome(is15mDuplexRangefinderLike),
  ),
})

// id 46: Haruna Kai Ni B
declareAACI({
  name: ['榛名改二乙'],
  id: 46,
  fixed: 8,
  modifier: 1.55,
  shipValid: isHarunaKaiNiB,
  equipsValid: validAll(
    hasSome(isCDMG),
    hasSome(isAARadar),
    hasSome((e) => is356mmTwinMountKai3Dazzle(e) || is356mmTwinMountKai4(e)),
  ),
})

// id 47: Shiratsuyu Class Kai 2
declareAACI({
  name: ['白露改二', '時雨改二', '時雨改三', '村雨改二', '春雨改二'],
  id: 47,
  fixed: 2,
  modifier: 1.3,
  shipValid: isShiratsuyuClassK2,
  equipsValid: validAny(
    validAll(
      hasSome(is127mmTwinMountTypeCKai3H),
      hasSome((e) => is25mmAAGunExtraEmplacement(e) || isAdvancedAARadar(e)),
    ),
    hasAtLeast(is127mmTwinMountTypeCKai3H, 2),
  ),
})

// id 48: Akizuki Class Kai / Kai 2
declareAACI({
  name: ['Akizuki Class Kai', 'Akizuki Class Kai 2', '吹雪改三護(六式)'],
  id: 48,
  fixed: 8,
  modifier: 1.75,
  shipValid: (ship) => (isAkizukiClass(ship) && isKai(ship)) || isFubukiK3Go(ship),
  equipsValid: validAny(
    validAll(hasAtLeast(is100mmTwinMountKaiAAFD, 2), hasSome(isAdvancedAARadar)),
  ),
})

// id 49: Fubuki Kai Ni / Shirayuki Kai Ni / Hatsuyuki Kai Ni / Fujinami Kai Ni / Hayanami Kai Ni / Hamanami Kai Ni / Tamanami Kai Ni
declareAACI({
  name: ['藤波改二', '吹雪改二', '白雪改二', '初雪改二', '早波改二', '浜波改二', '玉波改二'],
  id: 49,
  fixed: 5,
  modifier: 1.5,
  shipValid: (ship) =>
    isFubukiK2(ship) ||
    isFubukiK3(ship) ||
    isFubukiK3Go(ship) ||
    isShirayukiK2(ship) ||
    isHatsuyukiK2(ship) ||
    isFujinamiK2(ship) ||
    isHayanamiK2(ship) ||
    isHamanamiK2(ship) ||
    isTamananiK2(ship),
  equipsValid: validAny(
    validAll(hasAtLeast(isBuiltinHighAngleMount, 2), hasSome(isAdvancedAARadar)),
  ),
})

// id 50: Fubuki Kai Ni / Shirayuki Kai Ni / Hatsuyuki Kai Ni / Fujinami Kai Ni / Hayanami Kai Ni / Hamanami Kai Ni / Tamanami Kai Ni / Akizuki Class
declareAACI({
  name: [
    '吹雪改二',
    '白雪改二',
    '初雪改二',
    '藤波改二',
    '早波改二',
    '浜波改二',
    '玉波改二',
    'Akizuki Class',
  ],
  id: 50,
  fixed: 7,
  modifier: 1.5,
  shipValid: (ship) =>
    isFubukiK2(ship) ||
    isFubukiK3(ship) ||
    isFubukiK3Go(ship) ||
    isShirayukiK2(ship) ||
    isHatsuyukiK2(ship) ||
    isFujinamiK2(ship) ||
    isHayanamiK2(ship) ||
    isHamanamiK2(ship) ||
    isTamananiK2(ship) ||
    isAkizukiClass(ship),
  equipsValid: validAny(
    validAll(
      hasAtLeast(is100mmTwinMountKaiOrAAFD, 2),
      hasSome(isAdvancedAARadar),
      hasSome(isType94AAFD),
    ),
  ),
})

// id 51~52: Fubuki Kai Ni / Shirayuki Kai Ni / Hatsuyuki Kai Ni / Fujinami Kai Ni / Hayanami Kai Ni / Hamanami Kai Ni / Tamanami Kai Ni
declareAACI({
  name: ['吹雪改二', '白雪改二', '初雪改二', '藤波改二', '早波改二', '浜波改二', '玉波改二'],
  id: 51,
  fixed: 5,
  modifier: 1.35,
  shipValid: (ship) =>
    isFubukiK2(ship) ||
    isFubukiK3(ship) ||
    isFubukiK3Go(ship) ||
    isShirayukiK2(ship) ||
    isHatsuyukiK2(ship) ||
    isFujinamiK2(ship) ||
    isHayanamiK2(ship) ||
    isHamanamiK2(ship) ||
    isTamananiK2(ship),
  equipsValid: validAny(
    validAll(hasSome(is100mmTwinMountKaiOrAAFD), hasSome(isAdvancedAARadar), hasSome(isAAGun)),
  ),
})

declareAACI({
  name: ['吹雪改二', '白雪改二', '初雪改二', '藤波改二', '早波改二', '浜波改二', '玉波改二'],
  id: 52,
  fixed: 4,
  modifier: 1.4,
  shipValid: (ship) =>
    isFubukiK2(ship) ||
    isFubukiK3(ship) ||
    isFubukiK3Go(ship) ||
    isShirayukiK2(ship) ||
    isHatsuyukiK2(ship) ||
    isFujinamiK2(ship) ||
    isHayanamiK2(ship) ||
    isHamanamiK2(ship) ||
    isTamananiK2(ship),
  equipsValid: validAny(validAll(hasAtLeast(is100mmTwinMountKai, 2), hasSome(isType94AAFD))),
})
