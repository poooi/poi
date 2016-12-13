const remote = require('electron').remote
const ROOT = remote.getGlobal('ROOT')
const MODULE_PATH = remote.getGlobal('MODULE_PATH')

require('module').globalPaths.push(MODULE_PATH)
require('babel-register')(require(`${ROOT}/babel.config`))
require('coffee-react/register')
