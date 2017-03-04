const {keyBy, range, random, sampleSize} = require('lodash')
const start2 = require('./fixtures/start2.json')
const assert = require('assert')

const {damagedCheck} = require('../views/services/utils')

const $ships = keyBy(start2.api_mst_ship, 'api_id')
const $equips = keyBy(start2.api_mst_slotitem, 'api_id')

let sortieStatus, escapedPos, fleets, ships, equips
const LOOP_TIMES = 100

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
    fleets = range(0, 4).map(id => ({api_ship: range(id * 6 + 1 , 6 * id + 7 )}))
    sortieStatus = [true, false, false, false]
    escapedPos = []
    const _ships = range(1, 25).map(id => ({
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
    assert.equal(0, damagedCheck({$ships, $equips}, {sortieStatus, escapedPos}, {fleets, ships, equips}).length)
  })
  it('heavy damage for non sortie fleet is safe', () => {
    ships[9].api_nowhp = 8
    assert.equal(0, damagedCheck({$ships, $equips}, {sortieStatus, escapedPos}, {fleets, ships, equips}).length)
  })
  it('heavy damage for sortie fleet is dangerous', () => {
    ships[2].api_nowhp = 8
    assert.equal(1, damagedCheck({$ships, $equips}, {sortieStatus, escapedPos}, {fleets, ships, equips}).length)
    assert.equal('Lv. 2 - 睦月', damagedCheck({$ships, $equips}, {sortieStatus, escapedPos}, {fleets, ships, equips})[0])
  })
  it('heavy damage for sortie fleet flag ship is safe', () => {
    ships[1].api_nowhp = 8
    assert.equal(0, damagedCheck({$ships, $equips}, {sortieStatus, escapedPos}, {fleets, ships, equips}).length)
  })

  it(`heavy damage for sortie fleet is dangerous (many ships version)`, () => {
    range(LOOP_TIMES).forEach(time => {
      reset()
      const sampleCount = random(1, 5)
      sampleSize(range(2, 7), sampleCount).forEach(id => ships[id].api_nowhp = 8)
      assert.equal(sampleCount, damagedCheck({$ships, $equips}, {sortieStatus, escapedPos}, {fleets, ships, equips}).length)
    })
  })


  it(`heavy damage for ships with personel or goddess is safe`, () => {
    range(LOOP_TIMES).forEach(time => {
      reset()
      const damageCount = random(1, 5)
      const repairCount = random(1, damageCount)
      const damages = sampleSize(range(2, 7), damageCount)
      damages.forEach(id => ships[id].api_nowhp = 8)
      sampleSize(damages, repairCount).forEach(id => randomSetSlot(ships[id]))
      assert.equal((damageCount - repairCount), damagedCheck({$ships, $equips}, {sortieStatus, escapedPos}, {fleets, ships, equips}).length)
    })
  })

  it(`heavy damage for ships in combined fleets`, () => {
    range(LOOP_TIMES).forEach(time => {
      reset()
      sortieStatus = [true, true, false, false]
      let damageCount = random(1, 5)
      let repairCount = random(1, damageCount)
      const mainCount = damageCount - repairCount
      let damages = sampleSize(range(2, 7), damageCount)
      damages.forEach(id => ships[id].api_nowhp = 8)
      sampleSize(damages, repairCount).forEach(id => randomSetSlot(ships[id]))

      damageCount = random(1, 5)
      repairCount = random(1, damageCount)
      const escortCount = damageCount - repairCount
      damages = sampleSize(range(8, 13), damageCount)
      damages.forEach(id => ships[id].api_nowhp = 8)
      sampleSize(damages, repairCount).forEach(id => randomSetSlot(ships[id]))

      const count = mainCount + escortCount

      assert.equal(count, damagedCheck({$ships, $equips}, {sortieStatus, escapedPos}, {fleets, ships, equips}).length)
    })
  })

})
