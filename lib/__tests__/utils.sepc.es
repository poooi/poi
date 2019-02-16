import { log, warn, error, mergeConfig } from '../utils'

global.console = {
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
}

describe('log()', () => {
  it('should print a white string as log', () => {
    log('I am white log.')
    expect(console.log.mock.calls).toMatchSnapshot() // eslint-disable-line no-console
  })
  it('should print a white object string as log', () => {
    log({
      message: 'I am white log',
    })
    expect(console.log.mock.calls).toMatchSnapshot() // eslint-disable-line no-console
  })
})

describe('warn()', () => {
  it('should print a yellow string as warning', () => {
    warn('I am yellow warning.')
    expect(console.warn.mock.calls).toMatchSnapshot()
  })
  it('should print a yellow object as warning', () => {
    warn({
      message: 'I am yellow warning.',
    })
    expect(console.warn.mock.calls).toMatchSnapshot()
  })
})

describe('error()', () => {
  it('should print a bold red string as error', () => {
    error('I am bold red error..')
    expect(console.error.mock.calls).toMatchSnapshot()
  })
  it('should print a bold red object as error', () => {
    error({
      message: 'I am bold red error.',
    })
    expect(console.error.mock.calls).toMatchSnapshot()
  })
})

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
    expect(mergeConfig(defaultConfig, {})).not.toBe(defaultConfig)
  })

  it('default config value is not the same type of that user config, use default configs value', () => {
    expect(mergeConfig(defaultConfig, {})).toEqual(defaultConfig)
    expect(mergeConfig(defaultConfig, { galaxy: [42] })).toEqual(defaultConfig)
    expect(mergeConfig(defaultConfig, { galaxy: null })).toEqual(defaultConfig)
    expect(mergeConfig(defaultConfig, { bits: '0' })).toEqual(defaultConfig)
    expect(mergeConfig(defaultConfig, { year: '0' })).toEqual(defaultConfig)
    expect(mergeConfig(defaultConfig, { foo: 42 })).toEqual(defaultConfig)
    expect(mergeConfig(defaultConfig, { single: 10 })).toEqual(defaultConfig)
  })

  it('value of correct type in user config is honored', () => {
    expect(mergeConfig(defaultConfig, { galaxy: { answer: -1 } })).toEqual({
      ...defaultConfig,
      galaxy: { answer: -1 },
    })
    expect(mergeConfig(defaultConfig, { bits: ['lll'] })).toEqual({
      ...defaultConfig,
      bits: ['lll'],
    })
    expect(mergeConfig(defaultConfig, { year: 999 })).toEqual({ ...defaultConfig, year: 999 })
    expect(mergeConfig(defaultConfig, { foo: 'tanaka' })).toEqual({
      ...defaultConfig,
      foo: 'tanaka',
    })
    expect(mergeConfig(defaultConfig, { single: false })).toEqual({
      ...defaultConfig,
      single: false,
    })
  })

  it('other user config values exist in result', () => {
    expect(mergeConfig(defaultConfig, { chi: 'ba' })).toEqual({ ...defaultConfig, chi: 'ba' })
    expect(mergeConfig(defaultConfig, { galaxy: { chi: 'ba' } })).toEqual({
      ...defaultConfig,
      galaxy: { ...defaultConfig.galaxy, chi: 'ba' },
    })
  })
})
