import { createAction } from '@reduxjs/toolkit'

import type { IpcState } from '../ipc'

export const createInitIPCAction = createAction<IpcState>('@@initIPC')

export const createRegisterIPCAction = createAction<{
  scope: string
  opts: Record<string, unknown>
}>('@@registerIPC')

export const createUnregisterIPCAction = createAction<{
  scope: string
  keys: string[]
}>('@@unregisterIPC')

export const createUnregisterAllIPCAction = createAction<{
  scope: string
}>('@@unregisterAllIPC')
