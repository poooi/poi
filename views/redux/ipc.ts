import { createSlice } from '@reduxjs/toolkit'
import { mapValues, omit } from 'lodash'

import {
  createInitIPCAction,
  createRegisterIPCAction,
  createUnregisterIPCAction,
  createUnregisterAllIPCAction,
} from './actions/ipc'

type IpcScope = Record<string, boolean>
export type IpcState = Record<string, IpcScope>

const ipcSlice = createSlice({
  name: 'ipc',
  initialState: {} as IpcState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createInitIPCAction, (state, { payload }) => ({
        ...state,
        ...payload,
      }))
      // `ipc.register` merges into the existing scope, so the mirror must merge too
      // instead of replacing the scope with only the newly registered keys.
      .addCase(createRegisterIPCAction, (state, { payload }) => ({
        ...state,
        [payload.scope]: {
          ...state[payload.scope],
          ...mapValues(payload.opts, () => true),
        },
      }))
      .addCase(createUnregisterIPCAction, (state, { payload }) => {
        // `ipc.register` unregisters the keys it is about to set, which fires this
        // for scopes that do not exist yet; don't materialize an empty scope.
        if (!state[payload.scope]) {
          return state
        }
        return {
          ...state,
          [payload.scope]: omit(state[payload.scope], payload.keys),
        }
      })
      .addCase(
        createUnregisterAllIPCAction,
        (state, { payload }) => omit(state, payload.scope) as IpcState,
      )
  },
})

export const reducer = ipcSlice.reducer
