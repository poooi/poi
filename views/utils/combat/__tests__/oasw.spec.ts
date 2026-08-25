import type { GameEquip, GameShip } from '../types'

import { isOASW as isOASWCompat } from '../../oasw'
import { isOASW } from '../oasw'
const {
  ship: baseShip,
  equips: baseEquips,
}: {
  ship: GameShip
  equips: GameEquip[]
} = require('./fixtures/aaci-sample-ship.json')

// icon 18 (ソナー), no AA stat
const sonar: GameEquip = {
  ...baseEquips[0],
  api_slotitem_id: 46,
  api_type: [6, 7, 14, 18, 0],
  api_tyku: 0,
  api_tais: 10,
}

// 爆雷 — icon 17, not a sonar
const depthCharge: GameEquip = {
  ...baseEquips[0],
  api_slotitem_id: 226,
  api_type: [8, 8, 15, 17, 0],
  api_tyku: 0,
  api_tais: 4,
}

// 艦上攻撃機 (type[2] = 8)
const torpedoBomber = (tais: number): GameEquip => ({
  ...baseEquips[0],
  api_slotitem_id: 19,
  api_type: [5, 7, 8, 5, 0],
  api_tyku: 0,
  api_tais: tais,
})

describe('isOASW', () => {
  it('triggers unconditionally for 五十鈴改二', () => {
    expect(isOASW({ ...baseShip, api_ship_id: 141 }, [])).toBe(true)
  })

  it('does not trigger for a DD without sonar or enough ASW', () => {
    // fixture ship: Akizuki, taisen 71, radar + HA mounts only
    expect(isOASW(baseShip, baseEquips)).toBe(false)
  })

  it('triggers for a DD with ASW >= 100 and a sonar', () => {
    const dd: GameShip = { ...baseShip, api_taisen: [100, 100] }
    expect(isOASW(dd, [sonar])).toBe(true)
    expect(isOASW(dd, baseEquips)).toBe(false)
    expect(isOASW({ ...dd, api_taisen: [99, 100] }, [sonar])).toBe(false)
  })

  it('ignores 改修, which does not count toward the threshold', () => {
    // "ただし、改修はこの条件に影響しない" — a ★max sonar is worth ⅔√10 ≈ 2.1 of
    // 対潜 elsewhere, but a DD one short of 100 stays ineligible
    const almost: GameShip = { ...baseShip, api_taisen: [99, 100] }
    expect(isOASW(almost, [{ ...sonar, api_level: 10 }])).toBe(false)
    expect(isOASW({ ...almost, api_taisen: [100, 100] }, [{ ...sonar, api_level: 0 }])).toBe(true)
  })

  it('triggers for a DE with ASW >= 60 and a sonar', () => {
    const de: GameShip = { ...baseShip, api_stype: 1, api_taisen: [60, 60] }
    expect(isOASW(de, [sonar])).toBe(true)
    expect(isOASW({ ...de, api_taisen: [59, 60] }, [sonar])).toBe(false)
  })

  it('triggers for a DE with ASW >= 75 and total equip ASW >= 4, without sonar', () => {
    const de: GameShip = { ...baseShip, api_stype: 1, api_taisen: [75, 75] }
    expect(isOASW(de, [depthCharge])).toBe(true)
    expect(isOASW(de, [{ ...depthCharge, api_tais: 3 }])).toBe(false)
  })

  it('triggers for 大鷹改 with an ASW-capable torpedo bomber', () => {
    const taiyouKai: GameShip = { ...baseShip, api_ship_id: 380, api_stype: 7 }
    expect(isOASW(taiyouKai, [torpedoBomber(1)])).toBe(true)
    expect(isOASW(taiyouKai, [torpedoBomber(0)])).toBe(false)
  })

  it('triggers unconditionally for Visby and Visby改', () => {
    expect(isOASW({ ...baseShip, api_ship_id: 1062, api_taisen: [0, 0] }, [])).toBe(true)
    expect(isOASW({ ...baseShip, api_ship_id: 1067, api_taisen: [0, 0] }, [])).toBe(true)
  })

  it('triggers unconditionally for 日枝丸/改 despite being a 潜水母艦', () => {
    // stype 20 is not covered by any of the ship-type branches
    const hiedaMaru: GameShip = { ...baseShip, api_stype: 20, api_taisen: [0, 0] }
    expect(isOASW({ ...hiedaMaru, api_ship_id: 1065 }, [])).toBe(true)
    expect(isOASW({ ...hiedaMaru, api_ship_id: 1070 }, [])).toBe(true)
    // a different 潜水母艦 still does not
    expect(isOASW({ ...hiedaMaru, api_ship_id: 944, api_taisen: [100, 100] }, [sonar])).toBe(false)
  })

  it('deprecated import path re-exports the same function', () => {
    expect(isOASWCompat).toBe(isOASW)
  })
})
