import type { APIMstSlotitem } from 'kcsapi/api_start2/getData/response'

import { getImprovementBonus } from '..'

const spec = it

const data: {
  api_mst_slotitem: APIMstSlotitem[]
} = require('../../__tests__/fixtures/api_start2.json')

const $equip = (mstId: number): APIMstSlotitem => {
  const found = data.api_mst_slotitem.find(({ api_id }) => api_id === mstId)
  if (!found) throw new Error(`slotitem ${mstId} missing from api_start2 fixture`)
  return found
}

// 7: 35.6cm連装砲 (大口径主砲, which improves at 1.5√★ where the rest take √★)
const LARGE_GUN = 7
// 1: 12cm単装砲 (小口径主砲, 火力 1)
const SMALL_GUN = 1
// 10 / 467: 12.7cm連装高角砲 (火力 2) and 5inch連装砲(副砲配置) 集中配備 (火力 5),
// the two sides of the 高角砲 火力 4 split
const HA_SECONDARY = 10
const HA_SECONDARY_STRONG = 467
// 11: 15.2cm単装砲, a 副砲 that improves at a 主砲's rate
const MAIN_RATE_SECONDARY = 11
// 46: 九三式水中聴音機 (ソナー)
const SONAR = 46
// 226: 九五式爆雷 — a 爆雷 proper, so no 砲撃 bonus unlike its 投射機 category mates
const DEPTH_CHARGE = 226
// 27 / 28: 13号対空電探 (命中 1) and 22号対水上電探 (命中 3)
const AIR_RADAR = 27
const SURFACE_RADAR = 28
// 33: 改良型艦本式タービン
const BOILER = 33
// 13 / 95: 61cm三連装魚雷 and 潜水艦53cm艦首魚雷(8門)
const TORPEDO = 13
const SUBMARINE_TORPEDO = 95
// 69 / 326: カ号観測機 (対潜 9) and S-51J (対潜 12), either side of the 10 split
const AUTOGYRO = 69
const AUTOGYRO_STRONG = 326
// 60 / 486: 零式艦戦62型(爆戦) and 零式艦戦64型(制空戦闘機仕様)
const FIGHTER_BOMBER = 60
const ZERO_64_FIGHTER = 486
// 17: 天山 (艦上攻撃機), 169: 一式陸攻 (陸上攻撃機), 270: 東海(九〇一空) — a 陸攻
// carrying 対潜 (icon 47) rather than 雷装
const TORPEDO_BOMBER = 17
const LAND_BASED_ATTACKER = 169
const TOUKAI = 270
// 72 / 73: 増設バルジ(中型艦) and (大型艦)
const MEDIUM_BULGE = 72
const LARGE_BULGE = 73
// 54 / 59: 彩雲 (艦上偵察機) and 零式水上観測機 (水上偵察機 with its own contact value)
const CARRIER_RECON = 54
const OBSERVATION_SEAPLANE = 59

describe('getImprovementBonus', () => {
  spec('gives nothing at ★0, or for a category with no known bonus', () => {
    expect(getImprovementBonus($equip(LARGE_GUN), 0, 'power', 'fire')).toBe(0)
    expect(getImprovementBonus($equip(BOILER), 10, 'power', 'fire')).toBe(0)
  })

  spec('pays 大口径主砲 1.5√★ where a 小口径主砲 takes √★', () => {
    expect(getImprovementBonus($equip(LARGE_GUN), 4, 'power', 'fire')).toBe(3)
    expect(getImprovementBonus($equip(SMALL_GUN), 4, 'power', 'fire')).toBe(2)
  })

  spec('gives 副砲 a flat per-★ bonus, split on 火力 4 for 高角砲', () => {
    expect(getImprovementBonus($equip(HA_SECONDARY), 10, 'power', 'fire')).toBeCloseTo(2)
    expect(getImprovementBonus($equip(HA_SECONDARY_STRONG), 10, 'power', 'fire')).toBeCloseTo(3)
    // 夜戦 drops the 火力 split — every 高角砲 takes the low rate, except that
    // 5inch連装砲(副砲配置) 集中配備 measured 0.3 there and has its own rule
    expect(getImprovementBonus($equip(HA_SECONDARY), 10, 'power', 'yasen')).toBeCloseTo(2)
    expect(getImprovementBonus($equip(HA_SECONDARY_STRONG), 10, 'power', 'yasen')).toBeCloseTo(3)
  })

  spec('pays the whitelisted 副砲 at a 主砲 rate, before the category rule', () => {
    expect(getImprovementBonus($equip(MAIN_RATE_SECONDARY), 4, 'power', 'fire')).toBe(2)
  })

  spec('varies one piece of equipment by context', () => {
    const sonar = $equip(SONAR)
    expect(getImprovementBonus(sonar, 4, 'power', 'fire')).toBe(1.5)
    expect(getImprovementBonus(sonar, 4, 'power', 'asw')).toBe(2)
    expect(getImprovementBonus(sonar, 4, 'accuracy', 'asw')).toBeCloseTo(2.6)
    expect(getImprovementBonus(sonar, 4, 'evasion', 'torpedo')).toBe(3)
    expect(getImprovementBonus(sonar, 4, 'evasion', 'fire')).toBe(0)
  })

  spec('carves 爆雷 out of the 爆雷投射機 category with a zero rule', () => {
    expect(getImprovementBonus($equip(DEPTH_CHARGE), 4, 'power', 'fire')).toBe(0)
    expect(getImprovementBonus($equip(DEPTH_CHARGE), 4, 'power', 'asw')).toBe(2)
  })

  spec('pays 水上電探 more accuracy than 対空電探', () => {
    expect(getImprovementBonus($equip(SURFACE_RADAR), 4, 'accuracy', 'fire')).toBeCloseTo(3.4)
    expect(getImprovementBonus($equip(AIR_RADAR), 4, 'accuracy', 'fire')).toBe(2)
  })

  spec('gives 潜水艦魚雷 a flat rate where a surface torpedo scales with √★', () => {
    expect(getImprovementBonus($equip(TORPEDO), 4, 'power', 'torpedo')).toBeCloseTo(2.4)
    expect(getImprovementBonus($equip(SUBMARINE_TORPEDO), 4, 'power', 'torpedo')).toBeCloseTo(0.8)
  })

  spec('splits オートジャイロ on its own 対潜', () => {
    expect(getImprovementBonus($equip(AUTOGYRO), 10, 'power', 'asw')).toBeCloseTo(2)
    expect(getImprovementBonus($equip(AUTOGYRO_STRONG), 10, 'power', 'asw')).toBeCloseTo(3)
  })

  spec('sends a 爆戦 bonus to 対空 instead of 火力', () => {
    expect(getImprovementBonus($equip(FIGHTER_BOMBER), 10, 'power', 'fire')).toBe(0)
    expect(getImprovementBonus($equip(FIGHTER_BOMBER), 10, 'aa', 'fire')).toBeCloseTo(2.5)
    // 零式艦戦64型(制空戦闘機仕様) is the 0.3 exception wikiwiki lists on its own
    expect(getImprovementBonus($equip(ZERO_64_FIGHTER), 10, 'aa', 'fire')).toBeCloseTo(3)
  })

  spec('pays 遠征 accuracy exactly as a day battle, radars included', () => {
    expect(getImprovementBonus($equip(SURFACE_RADAR), 1, 'accuracy', 'exped')).toBe(1.7)
    // and does not floor it — only the stats an expedition scores on are floored
    expect(getImprovementBonus($equip(SURFACE_RADAR), 7, 'accuracy', 'exped')).toBeCloseTo(4.498)
  })

  spec('floors 遠征 and 触接 to one decimal', () => {
    // 0.5 * sqrt(7) = 1.3228
    expect(getImprovementBonus($equip(SMALL_GUN), 7, 'power', 'exped')).toBe(1.3)
    // 0.14 * 7 = 0.98, which must not round up to 1
    expect(getImprovementBonus($equip(OBSERVATION_SEAPLANE), 7, 'los', 'contact')).toBe(1.4)
    expect(getImprovementBonus($equip(CARRIER_RECON), 7, 'los', 'contact')).toBe(1.7)
    // 0.5 * sqrt(3) = 0.866, floored to 0.8 rather than rounded to 0.9
    expect(getImprovementBonus($equip(HA_SECONDARY), 3, 'power', 'exped')).toBe(0.8)
  })

  spec('separates the 対潜 stat from ASW attack power', () => {
    // A ★ on a sonar is worth ⅔√★ of 対潜, which the formula's ×1.5 turns into
    // √★ of attack power — the same ★, in two units
    expect(getImprovementBonus($equip(SONAR), 9, 'asw', 'fire')).toBeCloseTo(2)
    expect(getImprovementBonus($equip(SONAR), 9, 'power', 'asw')).toBe(3)
  })

  spec('gives 雷装 to 艦攻 and 陸攻, not just 魚雷', () => {
    // 天山: 0.2 per ★. 一式陸攻: 0.7√★, and 東海 carries 対潜 in its place
    expect(getImprovementBonus($equip(TORPEDO_BOMBER), 10, 'torpedo', 'fire')).toBeCloseTo(2)
    expect(getImprovementBonus($equip(LAND_BASED_ATTACKER), 4, 'torpedo', 'fire')).toBeCloseTo(1.4)
    expect(getImprovementBonus($equip(TOUKAI), 9, 'torpedo', 'fire')).toBe(0)
    expect(getImprovementBonus($equip(TOUKAI), 9, 'asw', 'fire')).toBeCloseTo(1.98)
  })

  spec('improves バルジ armor', () => {
    expect(getImprovementBonus($equip(MEDIUM_BULGE), 10, 'armor', 'fire')).toBeCloseTo(2)
    expect(getImprovementBonus($equip(LARGE_BULGE), 10, 'armor', 'fire')).toBeCloseTo(3)
  })

  spec('lets a per-id 触接 value beat its category', () => {
    // 零式水上観測機 is a 水上偵察機 (0.14) but measures 0.2
    expect(getImprovementBonus($equip(OBSERVATION_SEAPLANE), 5, 'los', 'contact')).toBe(1)
  })
})
