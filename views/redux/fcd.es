import { get } from 'lodash'

if (!window.isMain) {
  window.addEventListener('storage', e => {
    if (e.key === '_storeCache') {
      const {fcd} = JSON.parse(e.newValue)
      for (const key of Object.keys(fcd)) {
        window.dispatch({
          type: '@@updateFCD',
          value: fcd[key],
        })
      }
    }
  })
}

const initState = {
  version: {},
}

export function reducer(state=initState, {type, value}) {
  switch (type) {
  case '@@updateFCD':
    if (value.data && value.meta) {
      const {name, version} = value.meta
      if (name && version) {
        state = {
          ...state,
          version: {
            ...state.version,
            [name]: version,
          },
          [name]: value.data,
        }
      }
    }
  }
  return state
}
