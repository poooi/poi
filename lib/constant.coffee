path = require 'path-extra'
CSON = require 'cson'
module.exports = CSON.parseCSONFile path.join(__dirname, '..', 'assets', 'data', 'constant.cson')
