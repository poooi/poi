import React from 'react'

const __ = window.i18n.others.__.bind(window.i18n.others)
let initState = {
  history: [0, 1, 2, 3, 4].map((index) => (<div key={index++} className='alert alert-default alert-history-contents'>　</div>)),
  current: {
    type: 'default',
    content: __('Waiting for response...'),
    priority: 0,
    options: {
      dontReserve: true,
    },
  },
}

let stickyEnd = Date.now()

const pushToHistory = (history, toPush) => {
  history.push(<div key={Date.now()} className={`alert alert-${toPush.type} alert-history-contents`}>{toPush.content}</div>)
  if (history.length > 5) {
    history.shift()
  }
  return history
}

export function reducer(state=initState, {type, value}) {
  switch (type) {
  case '@@Alert': {
    value = Object.assign({
      type: 'default',
      content: '',
      priority: 0,
    }, value)
    if (typeof value.options !== 'object') {
      value.options = {}
    }
    let {history, current} = {...state}
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
    return newState
  }
  default:
    return state
  }
}
