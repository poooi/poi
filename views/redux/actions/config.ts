import { createAction } from '@reduxjs/toolkit'

interface ConfigPayload {
  path: string
  value: object
}

interface ConfigDeletePayload {
  path: string
}

export const createConfigAction = createAction<ConfigPayload>('@@Config')
export const createConfigDeleteAction = createAction<ConfigDeletePayload>('@@ConfigDelete')
