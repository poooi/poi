const {dispatch} = window

const DEFAULT_STICKYFOR = 3*1000  // Milliseconds

window.log = (msg, options) => {
  const value = {
    content: msg,
    type: 'default',
    priority: 0,
    stickyFor: DEFAULT_STICKYFOR,
    options,
  }
  dispatch({
    type: '@@Alert',
    value,
  })
}
window.success = (msg, options) => {
  const value = {
    content: msg,
    type: 'success',
    priority: 1,
    stickyFor: DEFAULT_STICKYFOR,
    options,
  }
  dispatch({
    type: '@@Alert',
    value,
  })
}
window.warn = (msg, options) => {
  const value = {
    content: msg,
    type: 'warning',
    priority: 2,
    stickyFor: DEFAULT_STICKYFOR,
    options,
  }
  dispatch({
    type: '@@Alert',
    value,
  })
}
window.error = (msg, options) => {
  const value = {
    content: msg,
    type: 'warning',
    priority: 4,
    stickyFor: DEFAULT_STICKYFOR,
    options,
  }
  dispatch({
    type: '@@Alert',
    value,
  })
}
