export interface ServerState {
  ip: string | null
  id: number | null
  name: string | null
}

interface ServerReadyAction {
  type: '@@ServerReady'
  serverInfo: ServerState
}

interface UnknownAction {
  type: string
}

type Action = ServerReadyAction | UnknownAction

const initState: ServerState = {
  ip: null,
  id: null,
  name: null,
}

export const reducer = (state: ServerState = initState, action: Action): ServerState => {
  if (action.type === '@@ServerReady') {
    const { serverInfo } = action as ServerReadyAction
    return serverInfo
  }

  return state
}
