jest.mock('fs-extra', () => ({
  accessSync: jest.fn(),
  writeFileSync: jest.fn(),
  constants: {},
}))
jest.mock('cson')
jest.mock('../default-config.ts', () => ({ foo: 'bar' }))
import CSON from 'cson'
import fs from 'fs-extra'

import config from '../config'

describe('config', () => {
  it('initially, should be filled with default value', () => {
    expect(CSON.parseCSONFile.mock.calls).toMatchSnapshot()
    expect(config.get('', null)).toMatchSnapshot()
  })

  it('should be set and get a string correctly', () => {
    config.set('path.to.value', 'Dead Beef')
    expect(config.get('path.to.value', null)).toBe('Dead Beef')
    expect(fs.writeFileSync).toHaveBeenCalled()
    expect(CSON.stringify.mock.calls).toMatchSnapshot()
    expect(fs.writeFileSync.mock.calls[0][0].includes(global.EXROOT)).toBe(true)
    expect(fs.writeFileSync.mock.calls[0][1]).toMatchSnapshot()
  })
  it('should be set and get a object correctly', () => {
    config.set('another', {
      a: 'b',
      c: 0xbb,
    })
    expect(fs.writeFileSync).toHaveBeenCalled()
    expect(CSON.stringify.mock.calls).toMatchSnapshot()
    expect(fs.writeFileSync.mock.calls[0][0].includes(global.EXROOT)).toBe(true)
    expect(fs.writeFileSync.mock.calls[0][1]).toMatchSnapshot()
    expect(config.get('another', null)).toEqual({
      a: 'b',
      c: 0xbb,
    })
  })
  it('should be get a null', () => {
    expect(config.get('null.path', null)).toBe(null)
  })
})
