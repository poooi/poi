const remote = require('@electron/remote')
window.ipc = remote.require('./lib/ipc')

require('./xhr-hack')
require('./img-hack')
require('./page-align')
require('./cookie-hack')
require('./disable-tab')
require('./capture-page')
