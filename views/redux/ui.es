const initState = {
  activeMainTab: 'main-view',
  activeFleetId: 0,
}

export function reducer(state = initState, { type, tabInfo, themes }) {
  switch (type) {
    case '@@TabSwitch': {
      return {
        ...state,
        ...tabInfo,
      }
    }
    default:
      return state
  }
}
