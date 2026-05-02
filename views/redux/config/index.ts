import type { DeepKeyOfArray } from 'shims/utils'

import { createSlice } from '@reduxjs/toolkit'
import { cloneDeep } from 'lodash-es'
import { type Config, config } from 'views/env'
import { reduxSet } from 'views/utils/tools'

import { createConfigAction } from '../actions'

const configSlice = createSlice({
  name: 'config',
  initialState: cloneDeep(config.get('')) satisfies Config,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createConfigAction, (state, { payload }) => {
      const { path, value } = payload
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      return reduxSet(state, path.split('.') as unknown as DeepKeyOfArray<Config>, value)
    })
  },
})

export const reducer = configSlice.reducer
