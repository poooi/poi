import _ from 'lodash'

const iconIs = n => equip => equip.api_type[3] === n
const shipIdIs = n => ship => ship.api_ship_id === n
const hasSome = pred => xs => xs.some(pred)

const isSonar = iconIs(18)

const isDiveBomber = equip => equip.api_type[2] === 7
const isTorpedoBomber = equip => equip.api_type[2] === 8
const isTypeZeroSonar = equip => equip.api_slotitem_id === 132
const taisenAbove = value => ship => ship.api_taisen[0] >= value

const isDE = ship => ship.api_stype === 1

const isIsuzuK2 = shipIdIs(141)
const isJervisKai = shipIdIs(394)
const isTatsutaKai = shipIdIs(478)

const isTaiyouKai = shipIdIs(380)
const isTaiyouKaiNi = shipIdIs(529)

const isASWAircraft = equip =>
  // 対潜哨戒機 (e.g. 三式指揮連絡機(対潜))
  equip.api_type[3] === 26 ||
  // オートジャイロ (e.g. カ号観測機)
  equip.api_type[3] === 69

const equipTais = equip => equip.api_tais || 0
const equipTaisAbove = value => equip => equipTais(equip) >= value

// focus on the 2nd argument of isOASW for func
const overEquips = func => (_ship, equips) => func(equips)

/*
   - reference as of Apr 10, 2018:

       http://wikiwiki.jp/kancolle/?%C2%D0%C0%F8%C0%E8%C0%A9%C7%FA%CD%EB%B9%B6%B7%E2

   - regarding _.overSome, _overEvery:

       * `_.overSome(f1, f2, ...)(...args)` is the same as `f1(...args) || f2(...args) || ...`.
         _.overEvery works similarly.

       * ship predicates (functions of Ship => bool) can be directly used

       * equips predicates (functions of Array<Equip> => bool) can be used with
         overEquips(<equips predicate>)

 */
// isOASWWith(allCVEIds: Array<ShipMstId>)(ship: Ship, equips: Array<Equip>): bool
export const isOASWWith = allCVEIds => _.overSome(
  // 無条件に発動
  isIsuzuK2, isJervisKai, isTatsutaKai,
  // 海防艦
  _.overEvery(
    isDE,
    _.overSome(
      // 必要対潜60 + ソナー
      _.overEvery(
        taisenAbove(60),
        overEquips(hasSome(isSonar))
      ),
      // 必要対潜値75 + 装備のみの対潜値が合計4以上
      _.overEvery(
        taisenAbove(75),
        overEquips(equips => _.sum(equips.map(equipTais)) >= 4)
      )
    )
  ),
  _.overEvery(
    // 駆逐 軽巡 雷巡 練巡
    ship => [2, 3, 4, 21].includes(ship.api_stype),
    taisenAbove(100),
    overEquips(hasSome(isSonar)),
  ),
  // 大鷹改 大鷹改二
  _.overEvery(
    _.overSome(isTaiyouKai, isTaiyouKaiNi),
    overEquips(
      hasSome(
        _.overSome(
          // 対潜値1以上の艦攻
          _.overEvery(isTorpedoBomber, equipTaisAbove(1)),
          // 艦爆
          isDiveBomber,
          // 三式指揮連絡機(対潜) / カ号観測機
          isASWAircraft
        )
      )
    )
  ),
  // 護衛空母 (excluding 大鷹改 大鷹改二)
  _.overEvery(
    s => !isTaiyouKai(s) && !isTaiyouKaiNi(s) && allCVEIds.includes(s.api_ship_id),
    _.overSome(
      _.overEvery(
        taisenAbove(65),
        overEquips(
          hasSome(
            _.overSome(
              // 対潜値7以上の艦攻
              _.overEvery(isTorpedoBomber, equipTaisAbove(7)),
              // 三式指揮連絡機(対潜) / カ号観測機
              isASWAircraft
            )
          )
        )
      ),
      _.overEvery(
        taisenAbove(50),
        overEquips(isTypeZeroSonar),
        overEquips(
          hasSome(
            _.overSome(
              // 対潜値7以上の艦攻
              _.overEvery(isTorpedoBomber, equipTaisAbove(7)),
              // 三式指揮連絡機(対潜) / カ号観測機
              isASWAircraft,
            )
          )
        )
      )
    )
  ),
)
