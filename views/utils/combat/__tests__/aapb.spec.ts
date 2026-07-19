import type { GameEquip, GameShip } from '../types'

import { getShipAAPB as getShipAAPBCompat } from '../../aapb'
import { getShipAAPB } from '../aapb'
const {
  ship: baseShip,
  equips: baseEquips,
}: {
  ship: GameShip
  equips: GameEquip[]
} = require('./fixtures/aaci-sample-ship.json')

// fixture equips: [13号対空電探改 (radar, tyku 4, lv 6), 10cm高角砲＋高射装置 ×2 (HA, tyku 10, lv 10)]
const [radar, haMount1, haMount2] = baseEquips

// 12cm30連装噴進砲改二 — master values from response-saver api_start2 capture
const rocketK2: GameEquip = {
  ...baseEquips[0],
  api_slotitem_id: 274,
  api_type: [4, 29, 21, 15, 0],
  api_tyku: 8,
  api_level: 0,
}

// 伊勢改二 — stype 10 (BBV, AAPB-capable), ctype 2 (伊勢型), mst api_tyku [48, 85]
const iseK2: GameShip = {
  ...baseShip,
  api_ship_id: 553,
  api_stype: 10,
  api_ctype: 2,
  api_tyku: [48, 85],
}

describe('getShipAAPB', () => {
  it('returns 0 for a ship type that cannot trigger AAPB', () => {
    // fixture ship is a DD (stype 2)
    expect(getShipAAPB(baseShip, [rocketK2, rocketK2])).toBe(0)
  })

  it('returns 0 without 12cm30連装噴進砲改二', () => {
    expect(getShipAAPB(iseK2, [radar, haMount1, haMount2])).toBe(0)
  })

  it('computes the wikiwiki success rate for 伊勢改二 with 2 launchers', () => {
    // basic AA        = mst tyku 48 + modernization (api_kyouka[2]) 36      = 84
    // rocket launcher = AA gun branch, tyku 8 (>= 8): 6*8 + 6*sqrt(0) = 48 (x2)
    // AA radar        = 3 * 4                                              = 12
    // HA mount        = HA branch, tyku 10 (>= 8): 4*10 + 3*sqrt(10)  (x2)
    // adjusted AA     = 2 * floor(sum / 2), luck term = 0.9 * api_lucky[0] (12)
    // + 15 per extra launcher + 25 伊勢型 bonus
    const weightedSum = 84 + 2 * 48 + 12 + 2 * (4 * 10 + 3 * Math.sqrt(10))
    const expected = ((2 * Math.floor(weightedSum / 2) + 0.9 * 12) * 100) / 281 + 15 * (2 - 1) + 25
    expect(getShipAAPB(iseK2, [rocketK2, rocketK2, radar, haMount1, haMount2])).toBeCloseTo(
      expected,
      10,
    )
  })

  it('applies no stacking bonus for a single launcher and no 伊勢型 bonus for other classes', () => {
    // same hull but a non-伊勢 class (ctype 6), single launcher, no other equips
    const kongouClassBBV: GameShip = { ...iseK2, api_ctype: 6 }
    const weightedSum = 84 + 48
    const expected = ((2 * Math.floor(weightedSum / 2) + 0.9 * 12) * 100) / 281
    expect(getShipAAPB(kongouClassBBV, [rocketK2])).toBeCloseTo(expected, 10)
  })

  it('deprecated pair-based shim returns exactly the same value', () => {
    const equips = [rocketK2, rocketK2, radar, haMount1, haMount2]
    expect(
      getShipAAPBCompat(
        [iseK2, iseK2],
        equips.map((equip) => [equip, equip, 0]),
      ),
    ).toBe(getShipAAPB(iseK2, equips))
  })
})
