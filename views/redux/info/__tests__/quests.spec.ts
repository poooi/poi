import {
  getTanakalendarQuarterMonth,
  saveQuestTracking,
  reducer as questsReducer,
  type SubgoalRecord,
  type QuestsState,
} from '../quests'
import moment from 'moment-timezone'
import { padStart } from 'lodash'
import { applyMiddleware, combineReducers, createStore } from 'redux'
// @ts-expect-error legacy .es module has no type declarations
import Scheduler from 'views/services/scheduler'

import {
  createAPIReqKousyouCreateitemResponseAction,
  createAPIReqKousyouDestroyitem2ResponseAction,
  createAPIReqKousyouRemodelSlotResponseAction,
  createAPIReqMapNextResponseAction,
  createAPIReqMapStartResponseAction,
  createAPIReqMissionResultResponseAction,
  createAPIReqPracticeResultResponseAction,
} from 'views/redux/actions'

import { questsCrossSliceMiddleware } from 'views/redux/middlewares/quests-cross-slice'

import practiceResultFixture from './__fixtures__/api_req_practice_battle_result_rank_a.json'
import missionResultFixture from './__fixtures__/api_req_mission_result_success.json'
import createItemFixture from './__fixtures__/api_req_kousyou_createitem_success.json'
import remodelSlotFixture from './__fixtures__/api_req_kousyou_remodel_slot_success_consumes_slots.json'
import destroyItemFixture from './__fixtures__/api_req_kousyou_destroyitem2_multiple_slots.json'
import mapStartFixture from './__fixtures__/api_req_map_start_updates_event_gauge_hp.json'
import mapNextFixture from './__fixtures__/api_req_map_next_with_itemget.json'

jest.mock('@electron/remote', () => ({
  require: (moduleName: string) => {
    if (moduleName === 'cson') {
      return {
        stringify: (value: unknown) => JSON.stringify(value),
      }
    }
    throw new Error(`Unexpected remote.require: ${moduleName}`)
  },
}))

jest.mock('views/utils/file-writer', () => {
  const writeMock = jest.fn()
  return {
    __esModule: true,
    __writeMock: writeMock,
    default: class FileWriter {
      write = writeMock
    },
  }
})

const spec = it

/**
 * creates a date for first quest refresh of given year and month
 */
const createDate = (year: number, month: number): Date =>
  new Date(+moment.tz(`${year}-${padStart(String(month), 2, '0')}-01 05:00`, 'Asia/Tokyo'))

const testCase = (year: number, month: number, expected: [number, number]): void => {
  expect(getTanakalendarQuarterMonth(createDate(year, month))).toStrictEqual(expected)
}

describe('getTanakalendarQuarterMonth', () => {
  spec('sample of a full year', () => {
    const qmBase = getTanakalendarQuarterMonth(createDate(2019, 1))
    // this "quarter" is relative, we don't care about its actual value
    // but will expect the following months to be consistent.
    const q0 = qmBase[0]
    // expect the first month of a year to be the second month in that quarter.
    expect(qmBase[1]).toBe(1)

    testCase(2019, 2, [q0, 2])

    testCase(2019, 3, [q0 + 1, 0])
    testCase(2019, 4, [q0 + 1, 1])
    testCase(2019, 5, [q0 + 1, 2])

    testCase(2019, 6, [q0 + 2, 0])
    testCase(2019, 7, [q0 + 2, 1])
    testCase(2019, 8, [q0 + 2, 2])

    testCase(2019, 9, [q0 + 3, 0])
    testCase(2019, 10, [q0 + 3, 1])
    testCase(2019, 11, [q0 + 3, 2])

    testCase(2019, 12, [q0 + 4, 0])
  })

  Scheduler._stopTick()
})

describe('saveQuestTracking', () => {
  const { __writeMock: writeMock } = jest.requireMock('views/utils/file-writer') as {
    __writeMock: jest.Mock
  }

  beforeEach(() => {
    writeMock.mockReset()
    // @ts-expect-error APPDATA_PATH is injected by poi runtime
    globalThis.APPDATA_PATH = 'C:\\tmp'
    // @ts-expect-error window.getStore is injected by poi runtime
    globalThis.window = {
      getStore: jest.fn((path: string) => {
        if (path === 'info.quests') {
          return {
            activeQuests: {
              1: { detail: { api_no: 1 }, time: 1 },
            },
          }
        }
        if (path === 'info.basic.api_member_id') {
          return '100'
        }
        return undefined
      }),
    }
  })

  it('does not mutate input records', () => {
    const records = {
      1: {
        id: 1,
        goal: { count: 3, required: 5 },
      },
    }

    saveQuestTracking(records)

    expect(records).toStrictEqual({
      1: {
        id: 1,
        goal: { count: 3, required: 5 },
      },
    })
  })

  it('writes derived fields to the serialized copy only', () => {
    const records = {
      1: {
        id: 1,
        goal: { count: 3, required: 5 },
      },
    }

    saveQuestTracking(records)

    expect(writeMock).toHaveBeenCalledTimes(1)
    const [, serialized] = writeMock.mock.calls[0]
    const saved = JSON.parse(serialized as string) as Record<string, unknown>

    expect(saved.time).toEqual(expect.any(Number))

    const savedRecord = saved['1'] as Record<string, unknown>
    expect(savedRecord.active).toBe(true)
    expect(savedRecord.count).toBe(3)
    expect(savedRecord.required).toBe(5)
  })
})

describe('quests reducer - questTrackingReducer paths', () => {
  type PayloadOf<AC> = AC extends (payload: infer P) => unknown ? P : never

  function getSubgoal(state: QuestsState, questId: number, subgoalId: string): SubgoalRecord {
    const record = state.records[questId]
    if (!record) throw new Error(`Missing quest record ${questId}`)

    const subgoal = record[subgoalId]
    if (!subgoal || typeof subgoal !== 'object') {
      throw new Error(`Missing subgoal ${subgoalId} for quest ${questId}`)
    }
    return subgoal
  }

  type RootStateShape = {
    info: {
      ships: Record<string, { api_ship_id?: number }>
      fleets: Record<string, { api_ship?: number[] }>
      equips: Record<string, { api_slotitem_id?: number }>
    }
    const: {
      $ships: Record<string, { api_name?: string; api_stype?: number; api_ctype?: number }>
      $equips: Record<string, { api_type?: number[] }>
    }
    sortie: { sortieStatus: boolean[] }
    battle: { result: { deckShipId: number[] } }
  }

  type PreloadedState = {
    info?: Partial<RootStateShape['info']>
    const?: Partial<RootStateShape['const']>
    sortie?: Partial<RootStateShape['sortie']>
    battle?: Partial<RootStateShape['battle']>
  }

  function createTestStore(preloadedQuests: QuestsState, preloadedState: PreloadedState = {}) {
    const defaults: RootStateShape = {
      info: { ships: {}, fleets: {}, equips: {} },
      const: { $ships: {}, $equips: {} },
      sortie: { sortieStatus: [] },
      battle: { result: { deckShipId: [] } },
    }

    const rootState = {
      ...defaults,
      ...preloadedState,
      info: {
        ...defaults.info,
        ...(preloadedState.info || {}),
      },
      const: {
        ...defaults.const,
        ...(preloadedState.const || {}),
      },
      sortie: {
        ...defaults.sortie,
        ...(preloadedState.sortie || {}),
      },
      battle: {
        ...defaults.battle,
        ...(preloadedState.battle || {}),
      },
    }

    const rootReducer = combineReducers({
      info: combineReducers({
        quests: questsReducer,
        ships: (state = rootState.info.ships) => state,
        fleets: (state = rootState.info.fleets) => state,
        equips: (state = rootState.info.equips) => state,
      }),
      const: (state = rootState.const) => state,
      sortie: (state = rootState.sortie) => state,
      battle: (state = rootState.battle) => state,
    })

    return createStore(
      rootReducer,
      {
        ...rootState,
        info: {
          ...rootState.info,
          quests: preloadedQuests,
        },
      },
      applyMiddleware(questsCrossSliceMiddleware),
    )
  }

  const baseState: QuestsState = {
    records: {
      1: { id: 1, practice: { count: 0, required: 1 } },
      2: { id: 2, practice_win: { count: 0, required: 1 } },
      3: { id: 3, mission_success: { count: 0, required: 1 } },
      4: { id: 4, create_item: { count: 0, required: 10 } },
      5: { id: 5, remodel_item: { count: 0, required: 1 } },
      6: {
        id: 6,
        destory_item: { count: 0, required: 2 },
        'destory_item@times': { count: 0, required: 3 },
      },
      7: { id: 7, sally: { count: 0, required: 1 } },
      8: { id: 8, reach_mapcell: { count: 0, required: 1 } },
    },
    activeQuests: {
      1: { detail: { api_no: 1 }, time: 0 },
      2: { detail: { api_no: 2 }, time: 0 },
      3: { detail: { api_no: 3 }, time: 0 },
      4: { detail: { api_no: 4 }, time: 0 },
      5: { detail: { api_no: 5 }, time: 0 },
      6: { detail: { api_no: 6 }, time: 0 },
      7: { detail: { api_no: 7 }, time: 0 },
      8: { detail: { api_no: 8 }, time: 0 },
    },
    questGoals: {
      1: {
        practice: { required: 1 },
      },
      2: {
        practice_win: { required: 1 },
      },
      3: {
        // NOTE: Must match api_quest_name from the real mission/result fixture.
        mission_success: { required: 1, mission: ['長距離練習航海'] },
      },
      4: {
        create_item: { required: 10 },
      },
      5: {
        remodel_item: { required: 1 },
      },
      6: {
        fuzzy: true,
        destory_item: { required: 2, slotitemType2: [2] },
        'destory_item@times': { required: 3, times: [1] },
      },
      7: {
        sally: { required: 1 },
      },
      8: {
        // NOTE: Keep this aligned with the real map/next fixture.
        reach_mapcell: { required: 1, maparea: [22], mapcell: [1] },
      },
    },
    activeCapacity: 5,
    activeNum: 0,
  }

  it('practice + practice_win', () => {
    const store = createTestStore(baseState, {
      sortie: { sortieStatus: [true] },
      info: {
        fleets: { 0: { api_ship: [1] } },
        ships: { 1: { api_ship_id: 1 } },
      },
      const: { $ships: { 1: { api_name: 'A', api_stype: 1, api_ctype: 1 } }, $equips: {} },
    })

    const payload = practiceResultFixture satisfies PayloadOf<
      typeof createAPIReqPracticeResultResponseAction
    >
    store.dispatch(createAPIReqPracticeResultResponseAction(payload))

    const after = store.getState().info.quests
    expect(getSubgoal(after, 1, 'practice').count).toBe(1)
    expect(getSubgoal(after, 2, 'practice_win').count).toBe(1)
  })

  it('mission_success', () => {
    const store = createTestStore(baseState)
    const payload = missionResultFixture satisfies PayloadOf<
      typeof createAPIReqMissionResultResponseAction
    >
    store.dispatch(createAPIReqMissionResultResponseAction(payload))

    const after = store.getState().info.quests
    expect(getSubgoal(after, 3, 'mission_success').count).toBe(1)
  })

  it('create_item increments by api_get_items size', () => {
    const store = createTestStore(baseState)
    const payload = createItemFixture satisfies PayloadOf<
      typeof createAPIReqKousyouCreateitemResponseAction
    >
    store.dispatch(createAPIReqKousyouCreateitemResponseAction(payload))

    const after = store.getState().info.quests
    expect(getSubgoal(after, 4, 'create_item').count).toBe(
      createItemFixture.body.api_get_items.length,
    )
  })

  it('remodel_item', () => {
    const store = createTestStore(baseState)
    const payload = remodelSlotFixture satisfies PayloadOf<
      typeof createAPIReqKousyouRemodelSlotResponseAction
    >
    store.dispatch(createAPIReqKousyouRemodelSlotResponseAction(payload))

    const after = store.getState().info.quests
    expect(getSubgoal(after, 5, 'remodel_item').count).toBe(1)
  })

  it('destory_item counts by slotitemType2 + times', () => {
    const store = createTestStore(baseState, {
      info: {
        equips: {
          46555: { api_slotitem_id: 10 },
          46569: { api_slotitem_id: 10 },
          46597: { api_slotitem_id: 10 },
          46624: { api_slotitem_id: 10 },
          46546: { api_slotitem_id: 10 },
          46357: { api_slotitem_id: 10 },
        },
      },
      const: {
        $ships: {},
        $equips: {
          10: { api_type: [0, 0, 2] },
        },
      },
    })

    const payload = destroyItemFixture satisfies PayloadOf<
      typeof createAPIReqKousyouDestroyitem2ResponseAction
    >
    store.dispatch(createAPIReqKousyouDestroyitem2ResponseAction(payload))

    const after = store.getState().info.quests
    expect(getSubgoal(after, 6, 'destory_item').count).toBe(2)
    expect(getSubgoal(after, 6, 'destory_item@times').count).toBe(1)
  })

  it('sally', () => {
    const store = createTestStore(baseState)
    const payload = mapStartFixture satisfies PayloadOf<typeof createAPIReqMapStartResponseAction>
    store.dispatch(createAPIReqMapStartResponseAction(payload))

    const after = store.getState().info.quests
    expect(getSubgoal(after, 7, 'sally').count).toBe(1)
  })

  it('reach_mapcell', () => {
    const store = createTestStore(baseState, {
      battle: { result: { deckShipId: [1] } },
      info: {
        ships: { 1: { api_ship_id: 1 } },
      },
      const: { $ships: { 1: { api_name: 'A', api_stype: 1, api_ctype: 1 } }, $equips: {} },
    })

    const payload = mapNextFixture satisfies PayloadOf<typeof createAPIReqMapNextResponseAction>
    store.dispatch(createAPIReqMapNextResponseAction(payload))

    const after = store.getState().info.quests
    expect(getSubgoal(after, 8, 'reach_mapcell').count).toBe(1)
  })
})
