const initState = {
  activeMainTab: 'mainView',
  activePluginName: '',
  activeFleetId: 0,
  themes: window.allThemes.slice(),
}

export function reducer(state=initState, {type, tabInfo, themes}) {
  switch (type) {
  case '@@TabSwitch': {
    return {
      ...state,
      ...tabInfo,
    }
  }
  case '@@UpdateThemes': {
    return {
      ...state,
      themes,
    }
  }
  default:
    return state
  }
}
