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

const equip = (mstId: number, { alv = 0, level = 0 } = {}): Equip =>
  ({ api_id: 1, api_slotitem_id: mstId, api_locked: 0, api_level: level, api_alv: alv }) as Equip

/** One ship carrying one plane, in the shape `getTyku` expects */
const oneSlot = (mstId: number, onslot: number, opts?: { alv?: number; level?: number }) => [
  [[equip(mstId, opts), $equip(mstId), onslot] as [Equip, APIMstSlotitem, number]],
]

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
