const { config } = window

const initState = {
  window: {
    width: window.innerWidth,
    height: window.innerHeight,
  },
  webview: {
    width: config.get('poi.webview.width', 1200),
    height: config.get('poi.webview.width', 1200) * 0.6,
    windowWidth: config.get('poi.webview.windowWidth', 1200),
    windowHeight: config.get('poi.webview.windowWidth', 1200) * 0.6,
    useFixedResolution: config.get('poi.webview.useFixedResolution', true),
    windowUseFixedResolution: config.get('poi.webview.windowUseFixedResolution', true),
    ref: null,
    refts: 0,
  },
  minishippane: {
    width: 250,
    height: 250,
  },
  shippane: {
    width: 450,
    height: 433,
  },
  mainpane: {
    width: 450,
    height: 433,
  },
  combinedpane: {
    width: 250,
    height: 135,
  },
}

export function reducer(state=initState, {type, value}) {
  switch (type) {
  case '@@LayoutUpdate':
    return {
      ...state,
      ...value,
      webview: {
        ...state.webview,
        ...value.webview,
      },
    }
  case '@@LayoutUpdate/webview/useFixedResolution':
    return {
      ...state,
      webview: {
        ...state.webview,
        useFixedResolution: value,
      },
    }
  case '@@LayoutUpdate/webview/windowUseFixedResolution':
    return {
      ...state,
      webview: {
        ...state.webview,
        windowUseFixedResolution: value,
      },
    }
  case '@@LayoutUpdate/webview/UpdateWebviewRef':
    return {
      ...state,
      webview: {
        ...state.webview,
        ref: value.ref,
        refts: value.ts,
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
