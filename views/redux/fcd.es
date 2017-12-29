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
