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
