import type { APIMstSlotitem } from 'kcsapi/api_start2/getData/response'
import type { Equip } from 'views/redux/info/equips'

import { equipIsAircraft, getTyku } from '../game-utils'

const spec = it

const data: { api_mst_slotitem: APIMstSlotitem[] } = require('./fixtures/api_start2.json')

const $equip = (mstId: number): APIMstSlotitem => {
  const found = data.api_mst_slotitem.find(({ api_id }) => api_id === mstId)
  if (!found) throw new Error(`slotitem ${mstId} missing from api_start2 fixture`)
  return found
}

// 548: 震電改三(試製 噴式震電), the first 噴式戦闘機 (api_type[2] === 56)
const JET_FIGHTER = 548
// 20: 零式艦戦52型, a plain 艦上戦闘機 with the same proficiency bonus table
const CARRIER_FIGHTER = 20
// 186: 一式陸攻 三四型 (陸上攻撃機, AA 4)
const LAND_BASED_ATTACKER = 186
// 396: 深山改 (大型陸上機, AA 2)
const HEAVY_BOMBER = 396
// 352: 秋水 (局地戦闘機, AA 3 — below the old `api_tyku > 3` improvement cutoff)
const INTERCEPTOR = 352
// 311 / 312: 二式陸上偵察機 and its 熟練 variant (陸上偵察機, AA 3, 索敵 8 / 9)
const LAND_BASED_RECON = 311
const LAND_BASED_RECON_SKILLED = 312

/** Land base action kinds, as passed to `getTyku` */
const SORTIE = 1
const AIR_DEFENSE = 2

const equip = (mstId: number, { alv = 0, level = 0 } = {}): Equip =>
  ({ api_id: 1, api_slotitem_id: mstId, api_locked: 0, api_level: level, api_alv: alv }) as Equip

type Slot = [Equip, APIMstSlotitem, number]

/** One ship carrying one plane, in the shape `getTyku` expects */
const oneSlot = (mstId: number, onslot: number, opts?: { alv?: number; level?: number }) => [
  [[equip(mstId, opts), $equip(mstId), onslot] as Slot],
]

/** One ship, as `[master id, planes on slot, improvement, proficiency]` per slot */
const ship = (...slots: [number, number, number, number][]) =>
  slots.map(([id, onslot, level, alv]) => [equip(id, { level, alv }), $equip(id), onslot] as Slot)

describe('getTyku', () => {
  spec('噴式戦闘機 counts towards fighter power', () => {
    // sqrt(18) * 17 = 72.13; `max` adds the top of the alv 0 internal exp range
    expect(getTyku(oneSlot(JET_FIGHTER, 18))).toEqual({ basic: 72, min: 72, max: 73 })
  })

  spec('噴式戦闘機 gets the fighter proficiency bonus', () => {
    // +22 type bonus at alv 7, plus sqrt(internal exp / 10)
    expect(getTyku(oneSlot(JET_FIGHTER, 18, { alv: 7 }))).toEqual({
      basic: 72,
      min: 97,
      max: 97,
    })
  })

  spec('噴式戦闘機 improvement adds 0.2 AA per star, like other fighters', () => {
    const jet = getTyku(oneSlot(JET_FIGHTER, 18, { level: 10 }))
    // sqrt(18) * (17 + 10 * 0.2) = 80.61
    expect(jet).toEqual({ basic: 72, min: 80, max: 81 })
  })

  spec('噴式戦闘機 has no 局地戦闘機 interception bonus on a land base', () => {
    // api_houk / api_houm are plain evasion / accuracy here, so air defense
    // (landbaseStatus 2) is worth the same as a sortie
    expect(getTyku(oneSlot(JET_FIGHTER, 18, { alv: 7 }), 2)).toEqual(
      getTyku(oneSlot(JET_FIGHTER, 18, { alv: 7 }), 1),
    )
  })

  spec('agrees with 制空権シミュレータ on a mixed carrier fleet', () => {
    // Fleet from a fighter power report, which the simulator totals at 929
    const fleet = [
      // 赤城改二: 震電改 / 零式艦戦53型(岩本隊) / 震電改 / 試製 陣風 x2
      ship([56, 21, 0, 7], [157, 21, 10, 7], [56, 32, 0, 7], [437, 12, 1, 7], [437, 4, 0, 7]),
      // 由良改二: 強風改 / 強風改二 / 強風改
      ship([217, 1, 10, 7], [485, 2, 0, 7], [217, 1, 10, 7]),
      // Saratoga Mk.II Mod.2: AU-1 / 天山一二型(友永隊) / XF5U / Corsair Mk.II(Ace)
      ship([475, 37, 0, 0], [94, 24, 0, 0], [375, 19, 0, 7], [435, 13, 0, 7]),
      // Intrepid: F4U-4 / Mosquito TR Mk.33 / 烈風改二 / XF5U
      ship([474, 37, 0, 0], [481, 36, 0, 0], [336, 19, 0, 7], [375, 4, 0, 7]),
    ]
    expect(fleet.map((s) => getTyku([s]).min)).toEqual([413, 97, 199, 220])
    expect(getTyku(fleet).min).toBe(929)
  })

  spec('大型陸上機 counts towards a land base', () => {
    // 深山改 has AA 2: sqrt(18) * 2 = 8.49
    expect(getTyku(oneSlot(HEAVY_BOMBER, 18), SORTIE)).toEqual({ basic: 8, min: 8, max: 9 })
  })

  spec('大型陸上機 improvement adds 0.5 AA per sqrt(star)', () => {
    // sqrt(18) * (2 + 0.5 * sqrt(10)) = 15.19
    expect(getTyku(oneSlot(HEAVY_BOMBER, 18, { level: 10 }), SORTIE)).toEqual({
      basic: 8,
      min: 15,
      max: 16,
    })
  })

  spec('陸上攻撃機 improvement adds 0.5 AA per sqrt(star), not 0.25 per star', () => {
    // 一式陸攻 三四型 has AA 4: sqrt(18) * (4 + 0.5 * sqrt(10)) = 23.68, and the
    // alv 7 internal exp adds sqrt(100 / 10) on top
    expect(getTyku(oneSlot(LAND_BASED_ATTACKER, 18, { level: 10, alv: 7 }), SORTIE)).toEqual({
      basic: 16,
      min: 26,
      max: 27,
    })
  })

  spec('局地戦闘機 improvement applies below AA 4', () => {
    // 秋水 has AA 3 and 迎撃 0, so a sortie is worth its plain AA plus 0.2 per star
    expect(getTyku(oneSlot(INTERCEPTOR, 18, { level: 10 }), SORTIE)).toEqual({
      basic: 12,
      min: 21,
      max: 22,
    })
  })

  spec('陸上偵察機 adds its own AA when the base is on air defense', () => {
    // sqrt(4) * 3 = 6, times the 索敵 8 air defense multiplier 1.18
    expect(getTyku(oneSlot(LAND_BASED_RECON, 4), AIR_DEFENSE)).toEqual({
      basic: 7,
      min: 7,
      max: 7,
    })
  })

  spec('陸上偵察機 air defense multiplier is 1.24 at 索敵 9', () => {
    // 秋水 on air defense: sqrt(18) * (3 + 迎撃 0 + 2 * 対爆 9) = 89.09, plus the
    // 熟練 recon's own sqrt(4) * 3 = 6, all multiplied by 1.24
    const base = [
      [
        [equip(INTERCEPTOR), $equip(INTERCEPTOR), 18] as [Equip, APIMstSlotitem, number],
        [equip(LAND_BASED_RECON_SKILLED), $equip(LAND_BASED_RECON_SKILLED), 4] as [
          Equip,
          APIMstSlotitem,
          number,
        ],
      ],
    ]
    expect(getTyku(base, AIR_DEFENSE)).toEqual({ basic: 22, min: 117, max: 119 })
  })

  spec('陸上偵察機 sortie multiplier is unchanged at 1.15 / 1.18', () => {
    const plain = getTyku(oneSlot(LAND_BASED_RECON, 4), SORTIE)
    const skilled = getTyku(oneSlot(LAND_BASED_RECON_SKILLED, 4), SORTIE)
    // sqrt(4) * 3 = 6, times 1.15 and 1.18
    expect([plain.min, skilled.min]).toEqual([6, 7])
  })

  spec('噴式戦闘機 matches a carrier fighter of the same AA stat', () => {
    // 零式艦戦52型 has AA 12 against the jet's 17, so compare the proficiency
    // bonus rather than the raw values
    const jet = getTyku(oneSlot(JET_FIGHTER, 18, { alv: 7 }))
    const fighter = getTyku(oneSlot(CARRIER_FIGHTER, 18, { alv: 7 }))
    const jetBase = getTyku(oneSlot(JET_FIGHTER, 18))
    const fighterBase = getTyku(oneSlot(CARRIER_FIGHTER, 18))
    expect(jet.min - jetBase.min).toBe(fighter.min - fighterBase.min)
  })
})

describe('equipIsAircraft', () => {
  spec('recognises 噴式戦闘機 by master data', () => {
    expect(equipIsAircraft($equip(JET_FIGHTER))).toBe(true)
  })

  spec('recognises the newer plane icons by id', () => {
    // 57: 試製 震電(局地戦闘機), 59: Ho229, 60: 震電改三
    expect([57, 58, 59, 60].map(equipIsAircraft)).toEqual([true, true, true, true])
  })

  spec('does not treat a gun icon as an aircraft', () => {
    expect(equipIsAircraft(1)).toBe(false)
  })
})
