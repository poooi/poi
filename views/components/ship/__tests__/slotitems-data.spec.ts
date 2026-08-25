import type { APIMstSlotitem } from 'kcsapi/api_start2/getData/response'

// The real instance pulls in electron config and the locale files off disk;
// the labels themselves are not what this is testing.
jest.mock('views/env-parts/i18next', () => ({
  __esModule: true,
  default: { t: (key: string) => key.replace(/^data:/, '') },
}))

import { getItemData } from '../slotitems-data'

const spec = it

const data: {
  api_mst_slotitem: APIMstSlotitem[]
} = require('../../../utils/__tests__/fixtures/api_start2.json')

const $equip = (mstId: number): APIMstSlotitem => {
  const found = data.api_mst_slotitem.find(({ api_id }) => api_id === mstId)
  if (!found) throw new Error(`slotitem ${mstId} missing from api_start2 fixture`)
  return found
}

// 7: 35.6cm連装砲, 46: 九三式水中聴音機, 486: 零式艦戦64型(制空戦闘機仕様),
// 352: 秋水 (局地戦闘機, whose 命中/回避 read as 対爆/迎撃),
// 226: 九五式爆雷, a 爆雷 proper rather than a 爆雷投射機
const LARGE_GUN = 7
const SONAR = 46
const DEPTH_CHARGE = 226
const ZERO_64_FIGHTER = 486
const INTERCEPTOR = 352

describe('getItemData', () => {
  spec('prints master stats alone at ★0', () => {
    expect(getItemData($equip(LARGE_GUN))).toEqual(['Firepower +15', 'AA +4', 'Range Long'])
  })

  spec('appends the ★ bonus each stat earns', () => {
    // 火力 15 clears the 12 threshold: 1.5 * sqrt(4) = 3
    expect(getItemData($equip(LARGE_GUN), 4)).toEqual([
      'Firepower +15 (+3)',
      // 対空 stays bare: a main gun's 対空 only improves on an expedition
      'AA +4',
      'Range Long',
    ])
  })

  spec('takes each stat from the context it is named for', () => {
    // Stat units throughout: a sonar's 対潜 rises by ⅔√★ = 1.33, which is the
    // √★ = 2 of ASW *attack* power seen through the formula's ×1.5
    expect(getItemData($equip(SONAR), 4)).toEqual(['ASW +6 (+1.3)', 'Accuracy +1 (+2)'])
  })

  spec('gives 爆雷 proper no 命中 bonus, unlike the 投射機 beside them', () => {
    expect(getItemData($equip(DEPTH_CHARGE), 4)).toEqual(['ASW +4 (+1.3)'])
  })

  spec('shows one decimal, and nothing where a stat does not improve', () => {
    expect(getItemData($equip(ZERO_64_FIGHTER), 7)).toEqual([
      'Firepower +1',
      'AA +9 (+2.1)',
      'Accuracy +1',
      'Evasion +3',
      'LOS +1',
    ])
  })

  spec('keeps the 局地戦闘機 labels for 対爆 / 迎撃', () => {
    expect(getItemData($equip(INTERCEPTOR), 10)).toEqual(['AA +3 (+2)', 'Anti-Bomber +9'])
  })
})
