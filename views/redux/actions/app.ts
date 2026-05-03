import { createAction } from '@reduxjs/toolkit'

import type { FcdValue } from '../fcd'
import type { WctfState } from '../wctf'

export const createWctfDbUpdateAction = createAction<WctfState>('@@wctf-db-update')

export const createUpdateFCDAction = createAction<FcdValue>('@@updateFCD')

export const createReplaceFCDAction = createAction<FcdValue>('@@replaceFCD')
