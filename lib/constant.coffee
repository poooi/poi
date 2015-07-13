Promise = require 'bluebird'
fs = Promise.promisifyAll require 'fs-extra'
path = require 'path-extra'
CSON = require 'cson'
async = Promise.coroutine

getConstants = async ->
  data = yield fs.readFileAsync path.join(__dirname, '..', 'constant.cson')
  module.exports = CSON.parse data

getConstants()
