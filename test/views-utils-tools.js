const _ = require('lodash')
const assert = require('assert')
const path = require('path')
const { isSubdirectory, compareUpdate } = require('../views/utils/tools')

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

describe('views/utils/tools', () => {
  describe('isSubdirectory', () => {
    it('should work under current os', () => {
      const subdir = path.resolve(__dirname, './ddddd')
      assert.equal(true, isSubdirectory(__dirname, subdir))
      const otherDir = path.resolve(__dirname, '../other')
      assert.equal(false, isSubdirectory(__dirname, otherDir))
    })

    it('should work with given paths', () => {
      _.each(pathPatterns, ([parent, dir, result]) => {
        assert.equal(result, isSubdirectory(parent, dir))
      })
    })

    if (process.platform === 'win32') {
      it('should work for windows', () => {
        _.each(win32PathPatterns, ([parent, dir, result]) => {
          assert.equal(result, isSubdirectory(parent, dir))
        })
      })
    }
  })

  describe('compareUpdate', () => {
    const test = (a, b, d) => {
      const c = compareUpdate(a, b, d)
      return [c !== a, c]
    }

    it('should work with cases below', () => {
      assert.deepEqual([false, 2], test(2, 2))
      assert.deepEqual([true, { 1: 'a', 2: 'b' }], test({ 1: 'a' }, { 2: 'b' }))
      assert.deepEqual([true, { 1: 'b' }], test({ 1: 'a'}, { 1: 'b' }))
      assert.deepEqual([false, { 1: 'a' }], test({ 1 : 'a'}, { 1 : 'a' }))
      assert.deepEqual([false, { 1: { 1 :2 } }], test({ 1: {1 : 2 } }, { 1 : { 1 : 2 } }))
      assert.deepEqual([true, { 1 : { 1 : [] } }], test({ 1 : { 1 : [], 2 : ['g'] } }, { 1 : { 1 : [] } }))
      assert.deepEqual([false, { 1 : { 1 : [], 2 : [ 'g' ] } }], test({ 1 : { 1 : [], 2 : ['g'] } }, { 1 : { 1 : [] } }, 2))

      const a = []
      a[1] = {1: 2}
      assert.deepEqual([true, [{ 1 : 1 }, { 1 : 2 }]], test([{ 1 : 1 }], a))
    })
  })
})

