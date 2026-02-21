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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type guard ensures this is ServerReadyAction
    const serverAction = action as ServerReadyAction
    return serverAction.serverInfo
  }
  return state
}
