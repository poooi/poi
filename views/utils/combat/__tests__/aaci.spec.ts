import { every, isFinite, each, isArray, isString, isBoolean } from 'lodash'

import type { GameEquip, GameShip } from '../aaci'

import { AACITable, getShipAACIs, getShipAvailableAACIs } from '../aaci'
const {
  ship,
  equips,
}: {
  ship: GameShip
  equips: GameEquip[]
} = require('./fixtures/aaci-sample-ship.json')

const isStringArray = (array: unknown): boolean =>
  isArray(array) && every(array, (e) => isString(e))

describe('AACI entry check', () => {
  it('AACI key is numeric', () => {
    expect(Object.keys(AACITable).length > 0).toBe(true)
    expect(every(Object.keys(AACITable), (key) => isFinite(+key))).toBe(true)
  })

  it('AACI entry should be valid', () => {
    each(AACITable, ({ name, id, fixed, modifier, shipValid, equipsValid }) => {
      void fixed
      expect(name?.length === 0 || isStringArray(name)).toBe(true)
      expect(isFinite(id) && id > 0).toBe(true)
      expect(isFinite(modifier) && modifier > 0).toBe(true)
      expect(isBoolean(shipValid(ship)))
      expect(isBoolean(equipsValid(equips))).toBe(true)
    })
  })

  it('sample ship should match aaci test', () => {
    expect(getShipAACIs(ship, equips).length > 0).toBe(true)
  })
})

describe('三十二駆改二 AACI (types 49~52)', () => {
  // 10cm連装高角砲改 (553) ×2 + 94式高射装置 (121) satisfies type 52
  const mount100mmKai: GameEquip = { ...equips[0], api_slotitem_id: 553 }
  const type94AAFD: GameEquip = { ...equips[0], api_slotitem_id: 121 }
  const type52Setup = [mount100mmKai, mount100mmKai, type94AAFD]

  // 玉波改二 (1033) is an already-covered member, used here as the control
  it.each([
    ['玉波改二', 1033],
    ['涼波改二', 1034],
    ['涼波改二補', 745],
  ])('%s is eligible for type 52', (_name, shipId) => {
    expect(getShipAvailableAACIs({ ...ship, api_ship_id: shipId }, type52Setup)).toContain(52)
  })

  it('does not extend to an unrelated 夕雲型改二', () => {
    // 長波改二補 (743) is not part of 三十二駆改二
    expect(getShipAvailableAACIs({ ...ship, api_ship_id: 743 }, type52Setup)).not.toContain(52)
  })
})

describe('AACI type 53 (飛龍改三)', () => {
  // ctype 25 = 飛龍型; overriding it keeps the Akizuki-class entries of the
  // fixture ship from also matching
  const hiryuuK3: GameShip = { ...ship, api_ship_id: 1031, api_stype: 11, api_ctype: 25 }
  // icon 16 = 高角砲
  const highAngleMount = (tyku: number): GameEquip => ({
    ...equips[0],
    api_slotitem_id: 122,
    api_type: [1, 1, 1, 16, 0],
    api_tyku: tyku,
  })
  // fixture equip 0 is 13号対空電探改 (対空 4)
  const aaRadar = equips[0]

  it('triggers with a 素対空9 特殊高角砲 and an 素対空4 対空電探', () => {
    expect(getShipAACIs(hiryuuK3, [highAngleMount(9), aaRadar])).toContain(53)
  })

  it('does not trigger below the equipment thresholds', () => {
    expect(getShipAvailableAACIs(hiryuuK3, [highAngleMount(8), aaRadar])).not.toContain(53)
    expect(
      getShipAvailableAACIs(hiryuuK3, [highAngleMount(9), { ...aaRadar, api_tyku: 3 }]),
    ).not.toContain(53)
  })

  it('is exclusive to 飛龍改三', () => {
    expect(
      getShipAvailableAACIs({ ...hiryuuK3, api_ship_id: 1030 }, [highAngleMount(9), aaRadar]),
    ).not.toContain(53)
  })
})
