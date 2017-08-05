const initState = {
  ip: null,
  id: null,
  name: null,
}

export const reducer = (state = initState, action) => {
  if (action.type === '@@ServerReady') {
    const {serverInfo} = action
    return serverInfo
  }

  return state
}
