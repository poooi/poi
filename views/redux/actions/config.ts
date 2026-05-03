import { createAction } from '@reduxjs/toolkit'

interface ConfigPayload {
  path: string
  value: object
}

export const createConfigAction = createAction<ConfigPayload>('@@Config')
