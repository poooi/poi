jest.mock('fs-extra')
jest.mock('cson')
jest.mock('../default-config', () => ({ foo: 'bar' }))
import config from '../config'
import fs from 'fs-extra'
import CSON from 'cson'

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
    expect(fs.writeFileSync.mock.calls).toMatchSnapshot()
  })
  it('should be set and get a object correctly', () => {
    config.set('another', {
      a: 'b',
      c: 0xbb,
    })
    expect(fs.writeFileSync).toHaveBeenCalled()
    expect(CSON.stringify.mock.calls).toMatchSnapshot()
    expect(fs.writeFileSync.mock.calls).toMatchSnapshot()
    expect(config.get('another', null)).toEqual({
      a: 'b',
      c: 0xbb,
    })
  })
  it('should be get a null', () => {
    expect(config.get('null.path', null)).toBe(null)
  })
})
