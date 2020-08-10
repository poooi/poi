import { keyBy, range, random, sampleSize, times, shuffle } from 'lodash'

import { damagedCheck } from '../utils'

const start2 = require('./fixtures/start2.json')
const $ships = keyBy(start2.api_mst_ship, 'api_id')
const $equips = keyBy(start2.api_mst_slotitem, 'api_id')

let sortieStatus, escapedPos, fleets, ships, equips
const LOOP_TIMES = 100
const MAX_ID = 500

const randomSetSlot = (ship) => {
  const index = random(0, 4)
  if (index == 4) {
    ship.api_slot_ex = random(2, 3)
  } else {
    ship.api_slot[index] = random(2, 3)
  }
}

describe('Validate sortie dangerous check', () => {
  const reset = () => {
    const shipIds = sampleSize(range(1, MAX_ID), 25)
    const chunks = shuffle([
      shipIds.slice(0, 6),
      shipIds.slice(6, 12),
      shipIds.slice(12, 18),
      shipIds.slice(18),
    ])
    fleets = range(4).map((id) => ({ api_ship: chunks[id] }))
    sortieStatus = [true, false, false, false]
    escapedPos = []
    const _ships = range(1, MAX_ID).map((id) => ({
      api_id: id,
      api_maxhp: 32,
      api_nowhp: 16,
      api_slot: [1, 1, -1, -1],
      api_slot_ex: -1,
      api_ship_id: 1,
      api_lv: id,
    }))
    ships = keyBy(_ships, 'api_id')
    equips = {
      1: {
        api_slotitem_id: 183, // 16inch三连装炮 Mk.7+GFCS
      },
      2: {
        api_slotitem_id: 42, // 応急修理要員
      },
      3: {
        api_slotitem_id: 43, // 応急修理女神
      },
    }
  }
  beforeEach(reset)

  it('normal condition without warning', () => {
    expect(
      damagedCheck({ $ships, $equips }, { sortieStatus, escapedPos }, { fleets, ships, equips })
        .length,
    ).toBe(0)
  })

  it('heavy damage for non sortie fleet is safe', () => {
    const { api_ship } = fleets[1]
    ships[api_ship[3]].api_nowhp = 8
    expect(
      damagedCheck({ $ships, $equips }, { sortieStatus, escapedPos }, { fleets, ships, equips })
        .length,
    ).toBe(0)
  })

  it('heavy damage for sortie fleet is dangerous', () => {
    const { api_ship } = fleets[0]
    ships[api_ship[2]].api_nowhp = 8
    expect(
      damagedCheck({ $ships, $equips }, { sortieStatus, escapedPos }, { fleets, ships, equips })
        .length,
    ).toBe(1)
    expect(
      damagedCheck({ $ships, $equips }, { sortieStatus, escapedPos }, { fleets, ships, equips })[0],
    ).toBe(`Lv. ${api_ship[2]} - 睦月`)
  })

  it('heavy damage for sortie fleet flag ship is safe', () => {
    const { api_ship } = fleets[0]
    ships[api_ship[0]].api_nowhp = 8
    expect(
      damagedCheck({ $ships, $equips }, { sortieStatus, escapedPos }, { fleets, ships, equips })
        .length,
    ).toBe(0)
  })

  it('heavy damage for sortie fleet is dangerous (all possible slots)', () => {
    range(0, 4).forEach((fleetId) => {
      range(7).forEach((index) => {
        const { api_ship } = fleets[fleetId]
        if (index >= api_ship.length) {
          return
        }
        const id = api_ship[index]
        sortieStatus.fill(false)
        sortieStatus[fleetId] = true
        const count = index === 0 ? 0 : 1
        const result = index === 0 ? [] : [`Lv. ${id} - 睦月`]
        ships[id].api_nowhp = 8
        expect(
          damagedCheck({ $ships, $equips }, { sortieStatus, escapedPos }, { fleets, ships, equips })
            .length,
        ).toBe(count)
        expect(
          damagedCheck(
            { $ships, $equips },
            { sortieStatus, escapedPos },
            { fleets, ships, equips },
          ),
        ).toEqual(result)
        ships[id].api_nowhp = ships[id].api_maxhp
      })
    })
  })

  it('heavy damage for sortie fleet for ship escaped is safe (all possible slots)', () => {
    range(0, 4).forEach((fleetId) => {
      range(7).forEach((index) => {
        reset()
        const { api_ship } = fleets[fleetId]
        if (index >= api_ship.length) {
          return
        }
        const id = api_ship[index]
        sortieStatus.fill(false)
        sortieStatus[fleetId] = true
        escapedPos = [index]
        ships[id].api_nowhp = 8
        expect(
          damagedCheck({ $ships, $equips }, { sortieStatus, escapedPos }, { fleets, ships, equips })
            .length,
        ).toBe(0)
        expect(
          damagedCheck(
            { $ships, $equips },
            { sortieStatus, escapedPos },
            { fleets, ships, equips },
          ),
        ).toEqual([])
      })
    })
  })

  it('heavy damage for sortie fleet is dangerous (many ships version)', () => {
    times(LOOP_TIMES, () => {
      reset()
      const { api_ship } = fleets[0]
      const sampleCount = random(1, api_ship.length - 1)
      sampleSize(api_ship.slice(1), sampleCount).forEach((id) => (ships[id].api_nowhp = 8))
      expect(
        damagedCheck({ $ships, $equips }, { sortieStatus, escapedPos }, { fleets, ships, equips })
          .length,
      ).toBe(sampleCount)
    })
  })

  it('heavy damage for ships with personel or goddess is safe', () => {
    times(LOOP_TIMES, () => {
      reset()
      const { api_ship } = fleets[0]
      const damageCount = random(1, api_ship.length - 1)
      const repairCount = random(1, damageCount)
      const damages = sampleSize(api_ship.slice(1), damageCount)
      damages.forEach((id) => (ships[id].api_nowhp = 8))
      sampleSize(damages, repairCount).forEach((id) => randomSetSlot(ships[id]))
      expect(
        damagedCheck({ $ships, $equips }, { sortieStatus, escapedPos }, { fleets, ships, equips })
          .length,
      ).toBe(damageCount - repairCount)
    })
  })

  it('heavy damage for ships in combined fleets', () => {
    times(LOOP_TIMES, () => {
      reset()
      sortieStatus = [true, true, false, false]
      const { api_ship: mainFleet } = fleets[0]
      const { api_ship: escortFleet } = fleets[1]

      const setFleet = (fleet) => {
        const damageCount = random(1, fleet.length)
        const repairCount = random(1, damageCount)
        let count = damageCount - repairCount

        const damages = sampleSize(fleet, damageCount)
        damages.forEach((id) => (ships[id].api_nowhp = 8))

        const repairs = sampleSize(damages, repairCount)
        repairs.forEach((id) => randomSetSlot(ships[id]))

        // both flagships are always safe
        if (damages.includes(fleet[0]) && !repairs.includes(fleet[0])) {
          count -= 1
        }
        return count
      }

      const count = setFleet(mainFleet) + setFleet(escortFleet)

      expect(
        damagedCheck({ $ships, $equips }, { sortieStatus, escapedPos }, { fleets, ships, equips })
          .length,
      ).toBe(count)
    })
  })
})
