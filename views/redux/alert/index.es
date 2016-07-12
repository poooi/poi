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

export function reducer(state=initState, {type, value}) {
  switch (type) {
  case '@@Alert': {
    return value
  }
  default:
    return state
  }
}
