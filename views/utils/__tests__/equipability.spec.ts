import type { ConstState } from 'views/redux/const'

import { indexify } from 'views/utils/tools'

import { canEquipType, canEquipShipItem, canEquipDaihatsu } from '../equipability'

const spec = it

const data = require('./fixtures/api_start2.json')

const constState = {
  $ships: indexify(data.api_mst_ship),
  $shipTypes: indexify(data.api_mst_stype),
  $equips: indexify(data.api_mst_slotitem),
  $equipShip: data.api_mst_equip_ship,
} satisfies ConstState

describe('canEquipType', () => {
  spec('三隈改二特 副砲(4): stype and override agree', () => {
    expect(canEquipType(507, 4, constState)).toBe(true)
  })

  spec('三隈改二特 魚雷(5): override grants, stype denies', () => {
    expect(canEquipType(507, 5, constState)).toBe(true)
  })

  spec('三隈改二特 小口径主砲(1): override denies, stype allows', () => {
    expect(canEquipType(507, 1, constState)).toBe(false)
  })

  spec('長門改二 小口径主砲(1): override grants, stype denies', () => {
    expect(canEquipType(541, 1, constState)).toBe(true)
  })

  spec('天龍改二 副砲(4): override denies, stype allows', () => {
    expect(canEquipType(477, 4, constState)).toBe(false)
  })
})

describe('canEquipShipItem', () => {
  spec('第百一号輸送艦改 + 12.7cm単装高角砲(後期型)(229): in number[] override', () => {
    expect(canEquipShipItem(727, 229, constState)).toBe(true)
  })

  spec('第百一号輸送艦改 + 12cm単装砲(1): not in number[] override, stype would allow', () => {
    expect(canEquipShipItem(727, 1, constState)).toBe(false)
  })

  spec('三隈改二特 + 61cm三連装魚雷(13): null override', () => {
    expect(canEquipShipItem(507, 13, constState)).toBe(true)
  })

  spec('三隈改二特 + 12cm単装砲(1): absent override denies', () => {
    expect(canEquipShipItem(507, 1, constState)).toBe(false)
  })

  spec('Norge改 + 21cm単装主砲(564): in number[] override, stype denies', () => {
    expect(canEquipShipItem(738, 564, constState)).toBe(true)
  })

  spec('Norge改 + 14cm単装砲(4): not in number[] override', () => {
    expect(canEquipShipItem(738, 4, constState)).toBe(false)
  })
})

describe('canEquipDaihatsu', () => {
  spec('千歳: stype fallback, can equip', () => {
    expect(canEquipDaihatsu(102, constState)).toBe(true)
  })

  spec('睦月: stype fallback, cannot equip', () => {
    expect(canEquipDaihatsu(1, constState)).toBe(false)
  })

  spec('秋津洲: override denies, stype would allow', () => {
    expect(canEquipDaihatsu(445, constState)).toBe(false)
  })

  spec('Верный: override grants, stype would deny', () => {
    expect(canEquipDaihatsu(147, constState)).toBe(true)
  })

  spec('涼波改二補: override grants, stype would deny', () => {
    expect(canEquipDaihatsu(745, constState)).toBe(true)
  })

  spec('朝霜改二補: override present, key absent, stype denies', () => {
    expect(canEquipDaihatsu(744, constState)).toBe(false)
  })
})
