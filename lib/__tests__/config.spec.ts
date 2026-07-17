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
    expect(jest.mocked(CSON.parseCSONFile).mock.calls).toMatchSnapshot()
    // @ts-expect-error null fallback does not match the Config type; the suite inspects the raw config object
    expect(config.get('', null)).toMatchSnapshot()
  })

  it('should be set and get a string correctly', () => {
    // @ts-expect-error 'path.to.value' is not in ConfigPath; the suite exercises arbitrary runtime paths against a mocked default config
    config.set('path.to.value', 'Dead Beef')
    // @ts-expect-error 'path.to.value' is not in ConfigPath; the suite exercises arbitrary runtime paths against a mocked default config
    expect(config.get('path.to.value', null)).toBe('Dead Beef')
    expect(fs.writeFileSync).toHaveBeenCalled()
    expect(jest.mocked(CSON.stringify).mock.calls).toMatchSnapshot()
    expect(String(jest.mocked(fs.writeFileSync).mock.calls[0][0]).includes(global.EXROOT)).toBe(
      true,
    )
    expect(jest.mocked(fs.writeFileSync).mock.calls[0][1]).toMatchSnapshot()
  })
  it('should be set and get a object correctly', () => {
    // @ts-expect-error 'another' is not in ConfigPath; the suite exercises arbitrary runtime paths against a mocked default config
    config.set('another', {
      a: 'b',
      c: 0xbb,
    })
    expect(fs.writeFileSync).toHaveBeenCalled()
    expect(jest.mocked(CSON.stringify).mock.calls).toMatchSnapshot()
    expect(String(jest.mocked(fs.writeFileSync).mock.calls[0][0]).includes(global.EXROOT)).toBe(
      true,
    )
    expect(jest.mocked(fs.writeFileSync).mock.calls[0][1]).toMatchSnapshot()
    // @ts-expect-error 'another' is not in ConfigPath; the suite exercises arbitrary runtime paths against a mocked default config
    expect(config.get('another', null)).toEqual({
      a: 'b',
      c: 0xbb,
    })
  })
  it('should be get a null', () => {
    // @ts-expect-error 'null.path' is not in ConfigPath; the suite exercises arbitrary runtime paths against a mocked default config
    expect(config.get('null.path', null)).toBe(null)
  })
})
