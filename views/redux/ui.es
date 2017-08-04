const initState = {
  activeMainTab: 'mainView',
  activePluginName: '',
  activeFleetId: 0,
  /*
     indicate whether last change made to
     active{MainTab, PluginName, FleetId} is made by auto switch
   */
  autoSwitched: false,
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
