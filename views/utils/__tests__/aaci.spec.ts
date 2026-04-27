import { every, isFinite, each, isArray, isString, isBoolean } from 'lodash'

import type { GameEquip, GameShip } from '../aaci'

import { AACITable, getShipAACIs } from '../aaci'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  ship,
  equips,
}: {
  ship: GameShip
  equips: GameEquip[]
} = require('./fixtures/aaci-sample-ship.json')

const isStringArray = (array: unknown): boolean =>
  isArray(array) && every(array, (e) => isString(e))

describe('AACI entry check', () => {
  it('AACI key is numeric', () => {
    expect(Object.keys(AACITable).length > 0).toBe(true)
    expect(every(Object.keys(AACITable), (key) => isFinite(+key))).toBe(true)
  })

  it('AACI entry should be valid', () => {
    each(AACITable, ({ name, id, fixed, modifier, shipValid, equipsValid }) => {
      void fixed
      expect(name?.length === 0 || isStringArray(name)).toBe(true)
      expect(isFinite(id) && id > 0).toBe(true)
      expect(isFinite(modifier) && modifier > 0).toBe(true)
      expect(isBoolean(shipValid(ship)))
      expect(isBoolean(equipsValid(equips))).toBe(true)
    })
  })

  it('sample ship should match aaci test', () => {
    expect(getShipAACIs(ship, equips).length > 0).toBe(true)
  })
})
