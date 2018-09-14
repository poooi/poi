const { every, isFinite, isBoolean, each, isArray, isString } = require('lodash')
const { AACITable, getShipAACIs } = require('../views/utils/aaci')
const assert = require('assert')
const { ship, equips } = require('./fixtures/aaci-sample-ship.json')

const isStringArray = array => isArray(array) && every(array, e => isString(e))

describe('AACI entry check', () => {
  it('AACI key is numeric', () => {
    assert.ok(Object.keys(AACITable).length > 0)
    assert.ok(every(Object.keys(AACITable), key => isFinite(+key)))
  })

  it('AACI entry should be valid', () => {
    each(AACITable, ({ name, id, fixed, modifier, shipValid, equipsValid }) => {
      assert.ok(name === '' || isStringArray(name))
      assert.ok(isFinite(id) && id > 0)
      assert.ok(isFinite(modifier) && modifier > 0)
      assert.ok(isBoolean(shipValid(ship)))
      assert.ok(isBoolean(equipsValid(equips)))
    })
  })

  it('sample ship should match aaci test', () => {
    assert.ok(getShipAACIs(ship, equips).length > 0)
  })
})
