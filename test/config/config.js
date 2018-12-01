const assert = require('assert')
global.ROOT = global.EXROOT = __dirname

let config = null

describe('config merging', () => {
  const { mergeConfig } = require('../../lib/utils')

  const defaultConfig = {
    foo: 'bar',
    year: 2018,
    bits: [0, 1],
    galaxy: {
      answer: 42,
    },
  }

  it('returns new object', () => {
    assert.ok(mergeConfig(defaultConfig, {}) !== defaultConfig)
  })

  it('default config value is not the same type of that user config, use default configs value', () => {
    assert.deepEqual(mergeConfig(defaultConfig, {}), defaultConfig)
    assert.deepEqual(mergeConfig(defaultConfig, { galaxy: [42] }), defaultConfig)
    assert.deepEqual(mergeConfig(defaultConfig, { galaxy: null }), defaultConfig)
    assert.deepEqual(mergeConfig(defaultConfig, { bits: '0' }), defaultConfig)
    assert.deepEqual(mergeConfig(defaultConfig, { year: '0' }), defaultConfig)
    assert.deepEqual(mergeConfig(defaultConfig, { foo: 42 }), defaultConfig)
  })

  it('other user config values exist in result', () => {
    assert.deepEqual(mergeConfig(defaultConfig, { chi: 'ba' }), { ...defaultConfig, chi: 'ba' })
    assert.deepEqual(mergeConfig(defaultConfig, { galaxy: { chi: 'ba' } }), {
      ...defaultConfig,
      galaxy: { ...defaultConfig.galaxy, chi: 'ba' },
    })
  })
})

describe('config', () => {
  beforeEach(() => {
    delete require.cache[require.resolve('../../lib/config')]
    config = require('../../lib/config')
  })
  describe('initially', () => {
    it('should be empty', () => {
      assert.deepEqual(config.get('', null), {})
    })
  })
  describe('set and get methods', () => {
    it('should be set and get a string correctly', () => {
      config.set('path.to.value', 'Dead Beef')
      assert.deepEqual(config.get('path.to.value', 'null'), 'Dead Beef')
    })
    it('should be set and get a object correctly', () => {
      config.set('another', {
        a: 'b',
        c: 0xbb,
      })
      assert.deepEqual(config.get('another', null), {
        a: 'b',
        c: 0xbb,
      })
    })
    it('should be get a null', () => {
      assert.deepEqual(config.get('null.path', null), null)
    })
  })
})
