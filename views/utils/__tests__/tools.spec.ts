import _ from 'lodash'
import path from 'path'

import { isSubdirectory, compareUpdate, cjkSpacing, constructArray } from '../tools'

type Pattern = [string, string, boolean]

const pathPatterns: Pattern[] = [
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

const win32PathPatterns: Pattern[] = [
  ['C:\\Foo', 'C:\\Foo\\Bar', true],
  ['C:\\foo', 'D:\\foo', false],
  ['C:\\foo', 'D:\\foo\\bar', false],
  ['C:\\foo', 'C:\\bar', false],
]

describe('views/utils/tools', () => {
  describe('isSubdirectory', () => {
    it('should work under current os', () => {
      const subdir = path.resolve(__dirname, './ddddd')
      expect(isSubdirectory(__dirname, subdir)).toBe(true)

      const otherDir = path.resolve(__dirname, '../other')
      expect(isSubdirectory(__dirname, otherDir)).toBe(false)
    })

    it('should work with given paths', () => {
      _.each(pathPatterns, ([parent, dir, result]) => {
        expect(isSubdirectory(parent, dir)).toBe(result)
      })
    })

    if (process.platform === 'win32') {
      it('should work for windows', () => {
        _.each(win32PathPatterns, ([parent, dir, result]) => {
          expect(isSubdirectory(parent, dir)).toBe(result)
        })
      })
    }
  })

  describe('compareUpdate', () => {
    const test = (a: unknown, b: unknown, d?: number) => {
      const c = compareUpdate(a, b, d)
      return [c !== a, c]
    }

    it('should work with cases below', () => {
      expect(test(2, 2)).toEqual([false, 2])
      expect(test({ 1: 'a' }, { 2: 'b' })).toEqual([true, { 1: 'a', 2: 'b' }])
      expect(test({ 1: 'a' }, { 1: 'b' })).toEqual([true, { 1: 'b' }])
      expect(test({ 1: 'a' }, { 1: 'a' })).toEqual([false, { 1: 'a' }])
      expect(test({ 1: { 1: 2 } }, { 1: { 1: 2 } })).toEqual([false, { 1: { 1: 2 } }])
      expect(test({ 1: { 1: [], 2: ['g'] } }, { 1: { 1: [] } })).toEqual([true, { 1: { 1: [] } }])
      expect(test({ 1: { 1: [], 2: ['g'] } }, { 1: { 1: [] } }, 2)).toEqual([
        false,
        { 1: { 1: [], 2: ['g'] } },
      ])

      const a = []
      a[1] = { 1: 2 }
      expect(test([{ 1: 1 }], a)).toEqual([true, [{ 1: 1 }, { 1: 2 }]])
    })
  })

  describe('cjkSpacing', () => {
    expect(cjkSpacing('你好world')).toMatchInlineSnapshot(`"你好 world"`)
    expect(cjkSpacing('こんいちわworld')).toMatchInlineSnapshot(`"こんいちわ world"`)
    expect(cjkSpacing('芸術は爆發だ!')).toMatchInlineSnapshot(`"芸術は爆發だ！"`)
  })

  describe('constructArray', () => {
    expect(constructArray([1], ['foo'])).toMatchInlineSnapshot(`
      Array [
        ,
        "foo",
      ]
    `)
    expect(constructArray([-1], ['foo'])).toMatchInlineSnapshot(`Array []`)
    // @ts-expect-error testing passing non number
    expect(constructArray(['bar'], ['foo'])).toMatchInlineSnapshot(`Array []`)
    expect(constructArray([0.92], ['foo'])).toMatchInlineSnapshot(`
      Array [
        "foo",
      ]
    `)
  })
})
