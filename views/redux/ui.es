const initState = {
  activeMainTab: 'mainView',
  activePluginName: '',
  activeFleetId: 0,
}

export function reducer(state=initState, {type, tabInfo}) {
  switch (type) {
  case '@@TabSwitch':{
    return {
      ...state,
      ...tabInfo,
    }}
  default:
    return state
  }
}
