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
        return reduxSet(state, path.split('.'), value)
      })
      .addCase(createConfigDeleteAction, (state, { payload }) => {
        const { path } = payload
        const next = reduxSet(state, path.split('.'), undefined)
        unset(next, path)
        return next
      })
  },
})

export const reducer = configSlice.reducer
