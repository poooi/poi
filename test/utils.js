const utils = require('../lib/utils')
const _ = require('lodash')
const assert = require('assert')
const path = require('path')

describe('utils', function() {
  describe('#log()', function() {
    it('should print a white string as log', function() {
      utils.log('I am white log.')
    })
    it('should print a white object string as log', function() {
      utils.log({
        message: 'I am white log',
      })
    })
  })
  describe('#warn()', function() {
    it('should print a yellow string as warning', function() {
      utils.warn('I am yellow warning.')
    })
    it('should print a yellow object as warning', function() {
      utils.warn({
        message: 'I am yellow warning.',
      })
    })
  })
  describe('#error()', function() {
    it('should print a bold red string as error', function() {
      utils.error('I am bold red error..')
    })
    it('should print a bold red object as error', function() {
      utils.error({
        message: 'I am bold red error.',
      })
    })
  })

  const pathPatterns = [
    ['/foo', '/foo', true],
    ['/foo', '/bar', false],
    ['/foo', '/foo/bar', true],
    ['/foo/bar', '/foo/foo', false],
    ['/foo/bar', '/foo/foo/bar', false],
    ['/foo/bar', '/bar/foo', false],
    ['/foo/bar', '/bar/../foo/bar', true],
    ['/foo/bar', '/foo/./bar', true],
    ['/foo/bar', './bar', false],
  ]

  const win32PathPatterns = [
    ['C:\\Foo', 'C:\\Foo\\Bar', true],
    ['C:\\foo', 'D:\\foo', false],
    ['C:\\foo', 'D:\\foo\\bar', false],
    ['C:\\foo', 'C:\\bar', false],
  ]

  describe('isSubdirectory', () => {
    it('should work under current os', () => {
      const subdir = path.resolve(__dirname, './ddddd')
      assert.equal(true, utils.isSubdirectory(__dirname, subdir))
      const otherDir = path.resolve(__dirname, '../other')
      assert.equal(false, utils.isSubdirectory(__dirname, otherDir))
    })

    it('should work with given paths', () => {
      _.each(pathPatterns, ([parent, dir, result]) => {
        assert.equal(result, utils.isSubdirectory(parent, dir))
      })
    })

    if (process.platform === 'win32') {
      it('should work for windows', () => {
        _.each(win32PathPatterns, ([parent, dir, result]) => {
          assert.equal(result, utils.isSubdirectory(parent, dir))
        })
      })
    }
  })
})
