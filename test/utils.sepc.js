const utils = require('../lib/utils')

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
})
