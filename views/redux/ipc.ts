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
      .addCase(createRegisterIPCAction, (state, { payload }) => ({
        ...state,
        [payload.scope]: mapValues(payload.opts, () => true),
      }))
      .addCase(createUnregisterIPCAction, (state, { payload }) => ({
        ...state,
        [payload.scope]: omit(state[payload.scope], ...payload.keys) as IpcScope,
      }))
      .addCase(
        createUnregisterAllIPCAction,
        (state, { payload }) => omit(state, payload.scope) as IpcState,
      )
  },
})

export const reducer = ipcSlice.reducer
