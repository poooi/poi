const DEFAULT_STICKYFOR = 3*1000  // Milliseconds

function dispatchAlertEvent(value) {
  const event = new CustomEvent('alert.new', {
    bubbles: true,
    cancelable: false,
    detail: value,
  })
  window.dispatchEvent(event)
}

window.log = (msg, options) => {
  const value = {
    content: msg,
    type: 'default',
    priority: 0,
    stickyFor: DEFAULT_STICKYFOR,
    ...options,
  }
  dispatchAlertEvent(value)
}
window.success = (msg, options) => {
  const value = {
    content: msg,
    type: 'success',
    priority: 1,
    stickyFor: DEFAULT_STICKYFOR,
    ...options,
  }
  dispatchAlertEvent(value)
}
window.warn = (msg, options) => {
  const value = {
    content: msg,
    type: 'warning',
    priority: 2,
    stickyFor: DEFAULT_STICKYFOR,
    ...options,
  }
  dispatchAlertEvent(value)
}
window.error = (msg, options) => {
  const value = {
    content: msg,
    type: 'warning',
    priority: 4,
    stickyFor: DEFAULT_STICKYFOR,
    ...options,
  }
  dispatchAlertEvent(value)
}
