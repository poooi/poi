jest.mock('@electron/remote', () => ({
  require: (moduleName: string) => {
    if (moduleName === 'cson') {
      return {
        stringify: (value: unknown) => JSON.stringify(value),
        parseCSONFile: () => ({}),
      }
    }
    throw new Error(`Unexpected remote.require: ${moduleName}`)
  },
}))

jest.mock('views/services/scheduler', () => ({
  schedule: () => undefined,
}))

jest.spyOn(console, 'warn').mockImplementation(() => undefined)

// combineReducers.es references `window.getStore` in node tests.
;(globalThis as any).window = {}

import { createAPIGetMemberRequireInfoAction } from '../../actions'
import { reducer } from '../index'

describe('info root reducer', () => {
  it('should keep only basic slice when admiral changes on require_info', () => {
    const state = {
      basic: { api_member_id: '100' },
      ships: { '1': { api_id: 1 } },
      fleets: [{ api_id: 1, api_ship: [1, -1, -1, -1, -1, -1] }],
      equips: { '1': { api_id: 1 } },
      repairs: [],
      constructions: [],
      resources: [1, 2, 3, 4, 5, 6, 7, 8],
      maps: { '11': { api_id: 11 } },
      quests: {
        records: {},
        activeQuests: {},
        questGoals: {},
        activeCapacity: 5,
        activeNum: 0,
      },
      airbase: [],
      presets: [],
      server: {},
      useitems: {},
    }

    const payload = {
      method: 'POST',
      path: '/kcsapi/api_get_member/require_info',
      body: { api_basic: { api_member_id: '200' } },
      postBody: { api_verno: '1' },
      time: 0,
    }

    // Compatibility: some reducers still read legacy `action.body`.
    // @ts-expect-error Partial payload; test is about legacy compat logic
    const action = createAPIGetMemberRequireInfoAction(payload)
    ;(action as any).body = payload.body
    ;(action as any).postBody = payload.postBody

    const result = (reducer as any)(state, action)

    expect(result.basic.api_member_id).toBe('200')
    expect(result.ships).toEqual({})
    expect(result.fleets).toEqual([])
    expect(result.equips).toEqual({})
    expect(result.resources).toEqual([])
  })
})
