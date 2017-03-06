const assert = require('assert')
global.ROOT = global.EXROOT = __dirname

let config = null

describe('config', function() {
  beforeEach(function() {
    delete require.cache[require.resolve('../../lib/config')]
    config = require('../../lib/config')
  })
  describe('initially', function() {
    it('should be empty', function() {
      assert.deepEqual(config.get('', null), {})
    })
  })
  describe('#set() #get()', function() {
    it('should be set and get a string correctly', function() {
      config.set('path.to.value', 'Dead Beef')
      assert.deepEqual(config.get('path.to.value', 'null'), 'Dead Beef')
    })
    it('should be set and get a object correctly', function() {
      config.set('another', {
        a: "b",
        c: 0xbb,
      })
      assert.deepEqual(config.get('another', null), {
        a: "b",
        c: 0xbb,
      })
    })
    it('should be get a null', function() {
      assert.deepEqual(config.get('null.path', null), null)
    })
  })
})
