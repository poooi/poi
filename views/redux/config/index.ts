import { createSlice } from '@reduxjs/toolkit'
import { cloneDeep } from 'lodash'
import { type Config, config } from 'views/env-parts/config'
import { reduxSet } from 'views/utils/tools'

import { createConfigAction } from '../actions'

const configSlice = createSlice({
  name: 'config',
  initialState: cloneDeep(config.get('')) satisfies Config,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createConfigAction, (state, { payload }) => {
      const { path, value } = payload
      return reduxSet(state, path.split('.'), value)
    })
  },
})

export const reducer = configSlice.reducer
