import * as utils from '../utils'

global.console = {
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
}

describe('log()', () => {
  it('should print a white string as log', () => {
    utils.log('I am white log.')
    expect(console.log.mock.calls).toMatchSnapshot()
  })
  it('should print a white object string as log', () => {
    utils.log({
      message: 'I am white log',
    })
    expect(console.log.mock.calls).toMatchSnapshot()
  })
})

describe('warn()', () => {
  it('should print a yellow string as warning', () => {
    utils.warn('I am yellow warning.')
    expect(console.warn.mock.calls).toMatchSnapshot()
  })
  it('should print a yellow object as warning', () => {
    utils.warn({
      message: 'I am yellow warning.',
    })
    expect(console.warn.mock.calls).toMatchSnapshot()
  })
})

describe('error()', () => {
  it('should print a bold red string as error', () => {
    utils.error('I am bold red error..')
    expect(console.error.mock.calls).toMatchSnapshot()
  })
  it('should print a bold red object as error', () => {
    utils.error({
      message: 'I am bold red error.',
    })
    expect(console.error.mock.calls).toMatchSnapshot()
  })
})
