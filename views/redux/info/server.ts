import { type UnknownAction } from '@reduxjs/toolkit'

import { createServerReadyAction } from '../actions'

export interface ServerState {
  ip: string | null
  id: number | null
  name: string | null
}

const initState: ServerState = {
  ip: null,
  id: null,
  name: null,
}

export const reducer = (state: ServerState = initState, action: UnknownAction): ServerState => {
  if (createServerReadyAction.match(action)) {
    return action.payload
  }
  return state
}
