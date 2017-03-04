const {keyBy, range} = require('lodash')
const start2 = require('./fixtures/start2.json')
const assert = require('assert')

const {damagedCheck} = require('../views/services/utils')

const $ships = keyBy(start2.api_mst_ship, 'api_id')
const $equips = keyBy(start2.api_mst_slotitem, 'api_id')

let sortieStatus, escapedPos, fleets, ships, equips

describe('Validate sortie dangerous check', () => {
  beforeEach(() => {
    fleets = range(1, 5).map(id => ({api_ship: range(id, 6 * id + 1)}))
    sortieStatus = [true, false, false, false]
    escapedPos = []
    const _ships = range(1, 25).map(id => ({
      api_id: id,
      api_maxhp: 32,
      api_nowhp: 32,
      api_slot: [1, 1, -1, -1],
      api_slot_ex: -1,
      api_ship_id: 1,
      api_lv: 1,
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
  })
  it('normal condition without warning', () => {
    assert.equal(0, damagedCheck({$ships, $equips}, {sortieStatus, escapedPos}, {fleets, ships, equips}).length)
  })
  it('heavy damage for non sortie fleet is safe', () => {
    ships[7].api_nowhp = 8
    assert.equal(0, damagedCheck({$ships, $equips}, {sortieStatus, escapedPos}, {fleets, ships, equips}).length)
  })
  it('heavy damage for sortie fleet is dangerous', () => {
    ships[2].api_nowhp = 7
    assert.equal(1, damagedCheck({$ships, $equips}, {sortieStatus, escapedPos}, {fleets, ships, equips}).length)
    assert.equal('Lv. 1 - 睦月', damagedCheck({$ships, $equips}, {sortieStatus, escapedPos}, {fleets, ships, equips})[0])
  })
})
