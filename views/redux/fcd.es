import { isEqual } from 'lodash'

if (!window.isMain) {
  window.addEventListener('storage', e => {
    if (e.key === '_storeCache') {
      const {fcd} = JSON.parse(e.newValue)
      for (const key of Object.keys(fcd)) {
        if (!isEqual(fcd[key], window.getStore(`fcd.${key}`))) {
          window.dispatch({
            type: "@@replaceFCD",
            value: {
              path: key,
              data: fcd[key],
            },
          })
        }
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
    break
  case '@@replaceFCD':
    if (value.path && value.data) {
      state = {
        ...state,
        [value.path]: value.data,
      }
    }
  }
  return state
}
