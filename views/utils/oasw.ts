import type { APISlotItem } from 'kcsapi/api_get_member/require_info/response'
import type { APIShip } from 'kcsapi/api_port/port/response'
import type { APIMstShip, APIMstSlotitem } from 'kcsapi/api_start2/getData/response'

type GameShip = APIShip & APIMstShip
type GameEquip = APISlotItem & APIMstSlotitem

type OASWPredicate = (ship: GameShip, equips: GameEquip[]) => boolean

// Custom typed combinators (lodash's overSome/overEvery can't type mixed-arity predicates)
const overSome =
  (...fns: OASWPredicate[]): OASWPredicate =>
  (ship, equips) =>
    fns.some((f) => f(ship, equips))
const overEvery =
  (...fns: OASWPredicate[]): OASWPredicate =>
  (ship, equips) =>
    fns.every((f) => f(ship, equips))

const iconIs = (n: number) => (equip: GameEquip) => equip.api_type?.[3] === n
const shipIdIs = (n: number) => (ship: GameShip) => ship.api_ship_id === n
const isKai = (ship: GameShip) => ship.api_getmes === '<br>'
const hasSome = (pred: (e: GameEquip) => boolean) => (xs: GameEquip[]) => xs.some(pred)
const hasMoreThan = (num: number) => (pred: (e: GameEquip) => boolean) => (xs: GameEquip[]) =>
  xs.filter(pred).length >= num

const isDepthCharge = iconIs(17)
const isSonar = iconIs(18)

const isDiveBomber = (equip: GameEquip) => equip.api_type?.[2] === 7
const isTorpedoBomber = (equip: GameEquip) => equip.api_type?.[2] === 8
const taisenAbove = (value: number) => (ship: GameShip) => (ship.api_taisen?.[0] ?? 0) >= value

const isDE = (ship: GameShip) => ship.api_stype === 1
const isCVL = (ship: GameShip) => ship.api_stype === 7

const isIsuzuK2 = shipIdIs(141)
const isFubukiK3Go = shipIdIs(1040)
const isJClassKai: OASWPredicate = (ship) =>
  ship.api_ship_id === 394 || ship.api_ship_id === 893 || ship.api_ship_id === 906
const isTatsutaKai = shipIdIs(478)
const isSamuelKai = shipIdIs(681)
const isSamuelKaiNi = shipIdIs(920)
const isFusoClassKaiNi: OASWPredicate = (ship) =>
  ship.api_ship_id === 411 || ship.api_ship_id === 412
const isFletcherClassKai: OASWPredicate = (ship) => ship.api_ctype === 91 && isKai(ship)
const isFletcherClassOrKai: OASWPredicate = (ship) =>
  ship.api_ship_id === 562 || ship.api_ship_id === 596 || isFletcherClassKai(ship, [])

const isTaiyouClassKai: OASWPredicate = (ship) =>
  ship.api_ship_id === 380 || ship.api_ship_id === 381
const isTaiyouClassKaiNi: OASWPredicate = (ship) =>
  ship.api_ship_id === 529 || ship.api_ship_id === 536
const isMogamiClassKouKaiNi: OASWPredicate = (ship) =>
  ship.api_ship_id === 508 || ship.api_ship_id === 509

const isHyugaKaiNi = shipIdIs(554)

const isYuubariKaiNiTei = shipIdIs(624)

const isKagaKaiNiGo = shipIdIs(646)

const isShinShuMaruKai = shipIdIs(626)

const isYamatoKaiNiJuu = shipIdIs(916)

const isKumanomaru: OASWPredicate = (ship) => ship.api_ship_id === 943 || ship.api_ship_id === 948

const isFixedWingASWAircraft = (equip: GameEquip) =>
  // 対潜哨戒機 (e.g. 三式指揮連絡機(対潜))
  equip.api_type?.[2] === 26

const isAutogyro = (equip: GameEquip) =>
  // オートジャイロ (e.g. カ号観測機)
  equip.api_type?.[2] === 25

const isSeaplaneBomber = (equip: GameEquip) => equip.api_type?.[2] === 11

const isASWAircraft = (equip: GameEquip) => isFixedWingASWAircraft(equip) || isAutogyro(equip)

const equipTais = (equip: GameEquip) => equip.api_tais ?? 0
const equipTaisAbove = (value: number) => (equip: GameEquip) => equipTais(equip) >= value

// focus on the 2nd argument of isOASW for func
const overEquips =
  (func: (equips: GameEquip[]) => boolean): OASWPredicate =>
  (_ship: GameShip, equips: GameEquip[]) =>
    func(equips)

/*
   - reference as of Jan 23, 2019: (TODO: not all implemented yet since Oct 18, 2018)

       http://wikiwiki.jp/kancolle/?%C2%D0%C0%F8%C0%E8%C0%A9%C7%FA%CD%EB%B9%B6%B7%E2

   - Shinyou-related OASW is kinda too messy at this point to be put here.

 */
// isOASW(ship: GameShip, equips: GameEquip[]): bool
export const isOASW: OASWPredicate = overSome(
  // 無条件に発動
  isIsuzuK2,
  isJClassKai,
  isTatsutaKai,
  isYuubariKaiNiTei,
  isSamuelKai,
  isFletcherClassOrKai,
  isSamuelKaiNi,
  isFubukiK3Go,
  // 海防艦
  overEvery(
    isDE,
    overSome(
      // 必要対潜60 + ソナー
      overEvery(taisenAbove(60), overEquips(hasSome(isSonar))),
      // 必要対潜値75 + 装備のみの対潜値が合計4以上
      overEvery(
        taisenAbove(75),
        overEquips((equips) => equips.map(equipTais).reduce((a, b) => a + b, 0) >= 4),
      ),
    ),
  ),
  overEvery(
    (ship: GameShip) =>
      [
        // 駆逐
        2,
        // 軽巡
        3,
        // 雷巡
        4,
        // 練巡
        21,
        // 補給
        22,
      ].includes(ship.api_stype ?? -1),
    taisenAbove(100),
    overEquips(hasSome(isSonar)),
  ),
  // 大鷹型改 大鷹型改二 加賀改二護
  overEvery(
    overSome(isTaiyouClassKai, isTaiyouClassKaiNi, isKagaKaiNiGo),
    overEquips(
      hasSome(
        (equip) =>
          // 対潜値1以上の艦攻
          (isTorpedoBomber(equip) && equipTaisAbove(1)(equip)) ||
          // 対潜値1以上の艦爆
          (isDiveBomber(equip) && equipTaisAbove(1)(equip)) ||
          // 三式指揮連絡機(対潜) / カ号観測機
          isASWAircraft(equip),
      ),
    ),
  ),
  // 護衛空母 (excluding 大鷹改 大鷹改二 最上型軽空母)
  overEvery(
    (s: GameShip) =>
      !isTaiyouClassKai(s, []) &&
      !isTaiyouClassKaiNi(s, []) &&
      !isMogamiClassKouKaiNi(s, []) &&
      isCVL(s),
    overSome(
      overEvery(
        taisenAbove(65),
        overEquips(
          hasSome(
            (equip) =>
              // 対潜値7以上の艦攻
              (isTorpedoBomber(equip) && equipTaisAbove(7)(equip)) ||
              // 三式指揮連絡機(対潜) / カ号観測機
              isASWAircraft(equip),
          ),
        ),
      ),
      overEvery(
        taisenAbove(50),
        overEquips(hasSome(isSonar)),
        overEquips(
          hasSome(
            (equip) =>
              // 対潜値7以上の艦攻
              (isTorpedoBomber(equip) && equipTaisAbove(7)(equip)) ||
              // 三式指揮連絡機(対潜) / カ号観測機
              isASWAircraft(equip),
          ),
        ),
      ),
      overEvery(
        taisenAbove(100),
        overEquips(hasSome(isSonar)),
        overEquips(
          hasSome(
            (equip) =>
              // 対潜値1以上の艦攻
              (isTorpedoBomber(equip) && equipTaisAbove(1)(equip)) ||
              // 対潜値1以上の艦爆
              (isDiveBomber(equip) && equipTaisAbove(1)(equip)),
          ),
        ),
      ),
    ),
  ),
  // 日向改二
  overEvery(
    isHyugaKaiNi,
    overSome(
      // 対潜値12以上のオートジャイロ
      overEquips(hasSome((equip) => isAutogyro(equip) && equipTaisAbove(12)(equip))),
      // オートジャイロ二機
      overEquips(hasMoreThan(2)(isAutogyro)),
    ),
  ),
  // 神州丸改 大和改二重
  overEvery(
    overSome(isShinShuMaruKai, isYamatoKaiNiJuu),
    taisenAbove(100),
    overEquips(
      hasSome(
        (equip) =>
          // 回転翼機
          isAutogyro(equip) ||
          // 水上爆撃機
          isSeaplaneBomber(equip),
      ),
    ),
    overEquips(hasSome(isSonar)),
  ),
  // 熊野丸/改
  overEvery(
    isKumanomaru,
    taisenAbove(100),
    overEquips(hasSome(isSonar)),
    overEquips(
      hasSome(
        (equip) =>
          // 対潜値1以上の艦爆
          (isDiveBomber(equip) && equipTaisAbove(1)(equip)) ||
          // オートジャイロ機
          isAutogyro(equip) ||
          // 対潜哨戒機
          isFixedWingASWAircraft(equip),
      ),
    ),
  ),
  // 扶桑改二 山城改二
  overEvery(
    isFusoClassKaiNi,
    taisenAbove(100),
    overEquips(hasSome(isSonar)),
    overEquips(
      hasSome(
        (equip) =>
          // 水上爆撃機
          isSeaplaneBomber(equip) ||
          // オートジャイロ機
          isAutogyro(equip) ||
          // 爆雷投射機/爆雷
          isDepthCharge(equip),
      ),
    ),
  ),
)

// Backward compatibility
export const isOASWWith = () => isOASW
