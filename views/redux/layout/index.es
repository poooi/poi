const { config } = window

const initState = {
  window: {
    width: window.innerWidth,
    height: window.innerHeight,
  },
  webview: {
    width: config.get('poi.webview.width', 800),
    height: config.get('poi.webview.width', 800) * 0.6,
    useFixedResolution: true,
  },
  minishippane: {
    width: 250,
    height: 250,
  },
  shippane: {
    width: 450,
    height: 433,
  },
}

export function reducer(state=initState, {type, value}) {
  switch (type) {
  case '@@LayoutUpdate':
    return {
      ...state,
      ...value,
    }
  case '@@LayoutUpdate/webview/useFixedResolution':
    return {
      ...state,
      webview: {
        ...state.webview,
        useFixedResolution: value,
      },
    }
  case '@@LayoutUpdate/webview/size':
    return {
      ...state,
      webview: {
        ...state.webview,
        ...value,
      },
    }
  default:
    return state
  }
}
