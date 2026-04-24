import { merge } from 'lodash'

describe('config merging', () => {
  const defaultConfig = {
    single: true,
    foo: 'bar',
    year: 2018,
    bits: [0, 1],
    galaxy: {
      answer: 42,
    },
  }

  it('returns new object', () => {
    expect(merge(defaultConfig, {})).not.toBe(defaultConfig)
  })

  it('default config value is not the same type of that user config, use default configs value', () => {
    expect(merge(defaultConfig, {})).toEqual(defaultConfig)
    expect(merge(defaultConfig, { galaxy: [42] })).toEqual(defaultConfig)
    expect(merge(defaultConfig, { galaxy: null })).toEqual(defaultConfig)
    expect(merge(defaultConfig, { bits: '0' })).toEqual(defaultConfig)
    expect(merge(defaultConfig, { year: '0' })).toEqual(defaultConfig)
    expect(merge(defaultConfig, { foo: 42 })).toEqual(defaultConfig)
    expect(merge(defaultConfig, { single: 10 })).toEqual(defaultConfig)
  })

  it('value of correct type in user config is honored', () => {
    expect(merge(defaultConfig, { galaxy: { answer: -1 } })).toEqual({
      ...defaultConfig,
      galaxy: { answer: -1 },
    })
    expect(merge(defaultConfig, { bits: ['lll'] })).toEqual({
      ...defaultConfig,
      bits: ['lll'],
    })
    expect(merge(defaultConfig, { year: 999 })).toEqual({ ...defaultConfig, year: 999 })
    expect(merge(defaultConfig, { foo: 'tanaka' })).toEqual({
      ...defaultConfig,
      foo: 'tanaka',
    })
    expect(merge(defaultConfig, { single: false })).toEqual({
      ...defaultConfig,
      single: false,
    })
  })

  it('other user config values exist in result', () => {
    expect(merge(defaultConfig, { chi: 'ba' })).toEqual({ ...defaultConfig, chi: 'ba' })
    expect(merge(defaultConfig, { galaxy: { chi: 'ba' } })).toEqual({
      ...defaultConfig,
      galaxy: { ...defaultConfig.galaxy, chi: 'ba' },
    })
  })
})
