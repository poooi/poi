utils = require '../lib/utils'

describe 'utils', ->
  describe '#log()', ->
    it 'should print a white string as log', ->
      utils.log 'I am white log.'
    it 'should print a white object string as log', ->
      utils.log {message: 'I am white log'}
  describe '#warn()', ->
    it 'should print a yellow string as warning', ->
      utils.warn 'I am yellow warning.'
    it 'should print a yellow object as warning', ->
      utils.warn {message: 'I am yellow warning.'}
  describe '#error()', ->
    it 'should print a bold red string as error', ->
      utils.error 'I am bold red error..'
    it 'should print a bold red object as error', ->
      utils.error {message: 'I am bold red error.'}
