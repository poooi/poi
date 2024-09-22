import _ from 'lodash'

const iconIs = (n) => (equip) => equip.api_type[3] === n
const shipIdIs = (n) => (ship) => ship.api_ship_id === n
const hasSome = (pred) => (xs) => xs.some(pred)
const hasMoreThan = (num) => (pred) => (xs) => xs.filter(pred).length >= num

const isDepthCharge = iconIs(17)
const isSonar = iconIs(18)

const isDiveBomber = (equip) => equip.api_type[2] === 7
const isTorpedoBomber = (equip) => equip.api_type[2] === 8
const taisenAbove = (value) => (ship) => ship.api_taisen[0] >= value

const isDE = (ship) => ship.api_stype === 1

const isIsuzuK2 = shipIdIs(141)
const isJClassKai = _.overSome([shipIdIs(394), shipIdIs(893), shipIdIs(906)])
const isTatsutaKai = shipIdIs(478)
const isSamuelKai = shipIdIs(681)
const isSamuelKaiNi = shipIdIs(920)
const isFusoClassKaiNi = _.overSome([shipIdIs(411), shipIdIs(412)])
const isFletcherClassOrKai = _.overSome([
  shipIdIs(562), // Johnston
  shipIdIs(689), // Johnston Kai
  shipIdIs(596), // Fletcher
  shipIdIs(692), // Fletcher Kai
  shipIdIs(628), // Fletcher Kai Mod.2
  shipIdIs(629), // Fletcher Mk.II
  shipIdIs(726), // Heywood L.E. Kai (Note: no OASW without kai)
])

const isTaiyouClassKai = _.overSome([shipIdIs(380), shipIdIs(381)])
const isTaiyouClassKaiNi = _.overSome([shipIdIs(529), shipIdIs(536)])
const isMogamiClassKouKaiNi = _.overSome([shipIdIs(508), shipIdIs(509)])

const isHyugaKaiNi = shipIdIs(554)

const isYuubariKaiNiTei = shipIdIs(624)

const isKagaKaiNiGo = shipIdIs(646)

const isShinShuMaruKai = shipIdIs(626)

const isYamatoKaiNiJuu = shipIdIs(916)

const isKumanomaru = _.overSome([shipIdIs(943), shipIdIs(948)])

const isFixedWingASWAircraft = (equip) =>
  // 対潜哨戒機 (e.g. 三式指揮連絡機(対潜))
  equip.api_type[2] === 26

const isAutogyro = (equip) =>
  // オートジャイロ (e.g. カ号観測機)
  equip.api_type[2] === 25

const isSeaplaneBomber = (equip) => equip.api_type[2] === 11

const isASWAircraft = (equip) => isFixedWingASWAircraft(equip) || isAutogyro(equip)

const equipTais = (equip) => equip.api_tais || 0
const equipTaisAbove = (value) => (equip) => equipTais(equip) >= value

// focus on the 2nd argument of isOASW for func
const overEquips = (func) => (_ship, equips) => func(equips)

/*
   - reference as of Jan 23, 2019: (TODO: not all implemented yet since Oct 18, 2018)

       http://wikiwiki.jp/kancolle/?%C2%D0%C0%F8%C0%E8%C0%A9%C7%FA%CD%EB%B9%B6%B7%E2

   - Shinyou-related OASW is kinda too messy at this point to be put here.

   - regarding _.overSome, _overEvery:

       * `_.overSome(f1, f2, ...)(...args)` is the same as `f1(...args) || f2(...args) || ...`.
         _.overEvery works similarly.

       * ship predicates (functions of Ship => bool) can be directly used

       * equips predicates (functions of Array<Equip> => bool) can be used with
         overEquips(<equips predicate>)

 */
// isOASWWith(allCVEIds: Array<ShipMstId>)(ship: Ship, equips: Array<Equip>): bool
export const isOASWWith = (allCVEIds) =>
  _.overSome(
    // 無条件に発動
    isIsuzuK2,
    isJClassKai,
    isTatsutaKai,
    isYuubariKaiNiTei,
    isSamuelKai,
    isFletcherClassOrKai,
    isSamuelKaiNi,
    // 海防艦
    _.overEvery(
      isDE,
      _.overSome(
        // 必要対潜60 + ソナー
        _.overEvery(taisenAbove(60), overEquips(hasSome(isSonar))),
        // 必要対潜値75 + 装備のみの対潜値が合計4以上
        _.overEvery(
          taisenAbove(75),
          overEquips((equips) => _.sum(equips.map(equipTais)) >= 4),
        ),
      ),
    ),
    _.overEvery(
      (ship) =>
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
        ].includes(ship.api_stype),
      taisenAbove(100),
      overEquips(hasSome(isSonar)),
    ),
    // 大鷹型改 大鷹型改二 加賀改二護
    _.overEvery(
      _.overSome(isTaiyouClassKai, isTaiyouClassKaiNi, isKagaKaiNiGo),
      overEquips(
        hasSome(
          _.overSome(
            // 対潜値1以上の艦攻
            _.overEvery(isTorpedoBomber, equipTaisAbove(1)),
            // 対潜値1以上の艦爆
            _.overEvery(isDiveBomber, equipTaisAbove(1)),
            // 三式指揮連絡機(対潜) / カ号観測機
            isASWAircraft,
          ),
        ),
      ),
    ),
    // 護衛空母 (excluding 大鷹改 大鷹改二)
    _.overEvery(
      (s) =>
        !isTaiyouClassKai(s) &&
        !isTaiyouClassKaiNi(s) &&
        !isMogamiClassKouKaiNi(s) &&
        allCVEIds.includes(s.api_ship_id),
      _.overSome(
        _.overEvery(
          taisenAbove(65),
          overEquips(
            hasSome(
              _.overSome(
                // 対潜値7以上の艦攻
                _.overEvery(isTorpedoBomber, equipTaisAbove(7)),
                // 三式指揮連絡機(対潜) / カ号観測機
                isASWAircraft,
              ),
            ),
          ),
        ),
        _.overEvery(
          taisenAbove(50),
          overEquips(hasSome(isSonar)),
          overEquips(
            hasSome(
              _.overSome(
                // 対潜値7以上の艦攻
                _.overEvery(isTorpedoBomber, equipTaisAbove(7)),
                // 三式指揮連絡機(対潜) / カ号観測機
                isASWAircraft,
              ),
            ),
          ),
        ),
        _.overEvery(
          taisenAbove(100),
          overEquips(hasSome(isSonar)),
          overEquips(
            hasSome(
              _.overSome(
                // 対潜値1以上の艦攻
                _.overEvery(isTorpedoBomber, equipTaisAbove(1)),
                // 対潜値1以上の艦爆
                _.overEvery(isDiveBomber, equipTaisAbove(1)),
              ),
            ),
          ),
        ),
      ),
    ),
    // 日向改二
    _.overEvery(
      isHyugaKaiNi,
      _.overSome(
        // 対潜値12以上のオートジャイロ
        overEquips(hasSome(_.overEvery(isAutogyro, equipTaisAbove(12)))),
        // オートジャイロ二機
        overEquips(hasMoreThan(2)(isAutogyro)),
      ),
    ),
    // 神州丸改 大和改二重
    _.overEvery(
      _.overSome(isShinShuMaruKai, isYamatoKaiNiJuu),
      taisenAbove(100),
      overEquips(
        hasSome(
          _.overSome(
            // 回転翼機
            isAutogyro,
            // 水上爆撃機
            isSeaplaneBomber,
          ),
        ),
      ),
      overEquips(hasSome(isSonar)),
    ),
    // 熊野丸/改
    _.overEvery(
      _.overSome(isKumanomaru),
      taisenAbove(100),
      overEquips(hasSome(isSonar)),
      overEquips(
        hasSome(
          _.overSome(
            // 対潜値1以上の艦爆
            _.overEvery(isDiveBomber, equipTaisAbove(1)),
            // オートジャイロ機
            isAutogyro,
            // 対潜哨戒機
            isFixedWingASWAircraft,
          ),
        ),
      ),
    ),
    // 扶桑改二 山城改二
    _.overEvery(
      _.overSome(isFusoClassKaiNi),
      taisenAbove(100),
      overEquips(hasSome(isSonar)),
      overEquips(
        hasSome(
          _.overSome(
            // 水上爆撃機
            isSeaplaneBomber,
            // オートジャイロ機
            isAutogyro,
            // 爆雷投射機/爆雷
            isDepthCharge,
          ),
        ),
      ),
    ),
  )
