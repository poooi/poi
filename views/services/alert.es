import React from 'react'

const {dispatch, getStore} = window
const DEFAULT_STICKYFOR = 3*1000  // Milliseconds

let stickyEnd = Date.now()

const pushToHistory = (history, toPush) => {
  history.push(<div key={Date.now()} className={`alert alert-${toPush.type} alert-history-contents`}>{toPush.content}</div>)
  if (history.length > 5) {
    history.shift()
  }
  return history
}

const dispatchAlertAsync = async (value) => {
  value = Object.assign({
    type: 'default',
    content: '',
    priority: 0,
  }, value)
  if (typeof value.options !== 'object') {
    value.options = {}
  }
  let {history, current} = {...getStore('alert')}
  let newState
  if ((value.priority) < current.priority && Date.now() < stickyEnd) {
    // Old message has higher priority, push new message to history
    history = pushToHistory(history, value)
    newState = {
      history: history,
      current: current,
    }
  } else if (!current.options.dontReserve) {
    // push old message to history
    history = pushToHistory(history, current)
    stickyEnd = Date.now() + (value.stickyFor || 3000)
    newState = {
      history: history,
      current: value,
    }
  } else {
    // dont push message to history
    newState = {
      history: history,
      current: value,
    }
  }
  dispatch({
    type: '@@Alert',
    value: newState,
  })
}

window.log = (msg, options) => {
  let value = {
    content: msg,
    type: 'default',
    priority: 0,
    stickyFor: DEFAULT_STICKYFOR,
    options,
  }
  dispatchAlertAsync(value)
}
window.success = (msg, options) => {
  let value = {
    content: msg,
    type: 'success',
    priority: 1,
    stickyFor: DEFAULT_STICKYFOR,
    options,
  }
  dispatchAlertAsync(value)
}
window.warn = (msg, options) => {
  let value = {
    content: msg,
    type: 'warning',
    priority: 2,
    stickyFor: DEFAULT_STICKYFOR,
    options,
  }
  dispatchAlertAsync(value)
}
window.error = (msg, options) => {
  let value = {
    content: msg,
    type: 'warning',
    priority: 4,
    stickyFor: DEFAULT_STICKYFOR,
    options,
  }
  dispatchAlertAsync(value)
}
