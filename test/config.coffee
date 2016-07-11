assert = require 'assert'
# Environments
global.ROOT = global.EXROOT = __dirname
require('babel-register')(require('../babel.config'))
config = null

describe 'config', ->
  beforeEach ->
    # Require config uncachedly
    delete require.cache[require.resolve '../lib/config']
    config = require '../lib/config'
  # Initial empty
  describe 'initially', ->
    it 'should be empty', ->
      assert.deepEqual config.get('', null), {}
  # Setter and Getter
  describe '#set() #get()', ->
    it 'should be set and get a string correctly', ->
      config.set 'path.to.value', 'Dead Beef'
      assert.deepEqual config.get('path.to.value', 'null'), 'Dead Beef'
    it 'should be set and get a object correctly', ->
      config.set 'another', {a: "b", c: 0xbb}
      assert.deepEqual config.get('another', null), {a: "b", c: 0xbb}
    it 'should be get a null', ->
      assert.deepEqual config.get('null.path', null), null
