{newAlert} = require '../components/info/alert'
DEFAULT_STICKYFOR = 3*1000  # Milliseconds

window.log = (msg, options) -> newAlert Object.assign
  message: msg
  type: 'default'
  priority: 0
  stickyFor: DEFAULT_STICKYFOR
  , options
window.success = (msg, options) -> newAlert Object.assign
  message: msg
  type: 'success'
  priority: 1
  stickyFor: DEFAULT_STICKYFOR
  , options
window.warn = (msg, options) -> newAlert Object.assign
  message: msg
  type: 'warning'
  priority: 2
  stickyFor: DEFAULT_STICKYFOR
  , options
window.error = (msg, options) -> newAlert Object.assign
  message: msg
  type: 'warning'
  priority: 4
  stickyFor: DEFAULT_STICKYFOR
  , options
