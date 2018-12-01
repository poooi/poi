const assert = require('assert')
const fs = require('fs-extra')
const path = require('path-extra')
const CSON = require('cson')

global.ROOT = global.EXROOT = __dirname

let config = null

describe('config with saved file', () => {
  beforeEach(() => {
    fs.writeFileSync(
      path.resolve(__dirname, './config.cson'),
      CSON.stringify({
        path: {
          to: {
            initial: {
              value: 'Hello World',
            },
          },
        },
      }),
    )
    delete require.cache[require.resolve('../../lib/config')]
    config = require('../../lib/config')
  })
  describe('initially', () => {
    it('should be a initial object', () => {
      const defaultConfig = require('../../lib/default-config')
      assert.deepEqual(config.get(''), {
        ...defaultConfig,
        path: {
          to: {
            initial: {
              value: 'Hello World',
            },
          },
        },
      })
      assert.deepEqual(config.get('path.to.initial.value'), 'Hello World')
    })
  })
  describe('set and get methods', () => {
    it('should be set and get a string correctly', () => {
      config.set('path.to.value', 'Dead Beef')
      assert.deepEqual(config.get('path.to.value'), 'Dead Beef')
    })
    it('should be set and get a object correctly', () => {
      config.set('another', {
        a: 'b',
        c: 0xbb,
      })
      assert.deepEqual(config.get('another'), {
        a: 'b',
        c: 0xbb,
      })
    })
    it('should be get a null', () => {
      assert.deepEqual(config.get('null.path'), null)
    })
  })
  afterEach(() => {
    fs.unlinkSync(path.join(__dirname, 'config.cson'))
  })
})
