import type { DeepKeyOfArray } from 'shims/utils'

import { createSlice } from '@reduxjs/toolkit'
import { cloneDeep, unset } from 'lodash'
import { type Config, config } from 'views/env'
import { reduxSet } from 'views/utils/tools'

import { createConfigAction } from '../actions'
import { createConfigDeleteAction } from '../actions/config'

const configSlice = createSlice({
  name: 'config',
  initialState: cloneDeep(config.get('')) satisfies Config,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createConfigAction, (state, { payload }) => {
        const { path, value } = payload
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        return reduxSet(state, path.split('.') as unknown as DeepKeyOfArray<Config>, value)
      })
      .addCase(createConfigDeleteAction, (state, { payload }) => {
        const { path } = payload
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const next = reduxSet(
          state,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          path.split('.') as unknown as DeepKeyOfArray<Config>,
          undefined,
        )
        unset(next, path)
        return next
      })
  },
})

export const reducer = configSlice.reducer
