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

export function reducer(state={}, {type, value}) {
  switch (type) {
  case '@@updateFCD':
    if (value.data && value.meta && value.meta.name && value.meta.version) {
      const {name, version} = value.meta
      if (!state[name] || (version > get(state, `${name}.meta.version`, '1970/01/01/01'))) {
        state = {
          ...state,
          [name]: value,
        }
      }
    }
  }
  return state
}
