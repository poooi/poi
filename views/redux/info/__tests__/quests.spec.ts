import { padStart } from 'lodash'
import moment from 'moment-timezone'
import { applyMiddleware, combineReducers, createStore } from 'redux'
import {
  createAPIGetMemberQuestlistResponseAction,
  createAPIReqKaisouPowerupResponseAction,
  createAPIReqKousyouCreateitemResponseAction,
  createAPIReqKousyouDestroyitem2ResponseAction,
  createAPIReqKousyouRemodelSlotResponseAction,
  createAPIReqMapNextResponseAction,
  createAPIReqMapStartResponseAction,
  createAPIReqMissionResultResponseAction,
  createAPIReqPracticeResultResponseAction,
  createInfoQuestsApplyProgressAction,
} from 'views/redux/actions'
import { questsCrossSliceMiddleware } from 'views/redux/middlewares/quests-cross-slice'
import Scheduler from 'views/services/scheduler'
import { shipRemodelSources, type RemodelRoster } from 'views/utils/selectors'

import type { ActiveQuest, GoalKey, QuestRecord, SubgoalRecord, QuestsState } from '../quests'

import {
  getTanakalendarQuarterMonth,
  satisfyShip,
  saveQuestTracking,
  reducer as questsReducer,
} from '../quests'
import { outdateActiveQuests, outdateRecords } from '../quests/records'
import { ONE_DAY } from '../quests/time'
import powerupFixture from './__fixtures__/api_req_kaisou_powerup_consumes_material_ships.json'
import createItemFixture from './__fixtures__/api_req_kousyou_createitem_success.json'
import destroyItemFixture from './__fixtures__/api_req_kousyou_destroyitem2_multiple_slots.json'
import remodelSlotFixture from './__fixtures__/api_req_kousyou_remodel_slot_success_consumes_slots.json'
import mapNextFixture from './__fixtures__/api_req_map_next_with_itemget.json'
import mapStartFixture from './__fixtures__/api_req_map_start_updates_event_gauge_hp.json'
import missionResultFixture from './__fixtures__/api_req_mission_result_success.json'
import practiceResultFixture from './__fixtures__/api_req_practice_battle_result_rank_a.json'

jest.mock('cson', () => ({
  parseCSONFile: () => ({}),
  stringify: (value: unknown) => JSON.stringify(value),
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

  const activeQuests: Record<string | number, ActiveQuest> = {
    // @ts-expect-error minimal fixture: detail only carries api_no used by quest tracking
    1: { detail: { api_no: 1 }, time: 1 },
  }
  const admiralId = '100'

  beforeEach(() => {
    writeMock.mockReset()
    globalThis.APPDATA_PATH = 'C:\\tmp'
  })

  it('does not mutate input records', () => {
    const records = {
      1: {
        id: 1,
        goal: { count: 3, required: 5 },
      },
    }

    saveQuestTracking(records, activeQuests, admiralId)

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

    saveQuestTracking(records, activeQuests, admiralId)

    expect(writeMock).toHaveBeenCalledTimes(1)
    const [, serialized] = writeMock.mock.calls[0]
    const saved = JSON.parse(String(serialized)) satisfies Record<string, unknown>

    expect(saved.time).toEqual(expect.any(Number))

    const savedRecord = saved['1']
    if (typeof savedRecord !== 'object' || savedRecord === null) {
      throw new Error('savedRecord should be an object')
    }
    const isValidRecord = (r: unknown): r is Record<string, unknown> =>
      typeof r === 'object' && r !== null
    if (!isValidRecord(savedRecord)) {
      throw new Error('savedRecord should be a Record')
    }
    const record = savedRecord
    expect(record.active).toBe(true)
    expect(record.count).toBe(3)
    expect(record.required).toBe(5)
  })
})

describe('quests reducer - questTrackingReducer paths', () => {
  type PayloadOf<AC> = AC extends (payload: infer P) => unknown ? P : never
  type ConstructorWithPrototype = { readonly prototype: object }

  function createPrototypeInvariantConstructor(): ConstructorWithPrototype {
    function Constructor() {}
    Object.defineProperty(Constructor, 'prototype', { writable: false })
    return new Proxy(Constructor, {
      get(target, property, receiver) {
        if (property === 'prototype') {
          return {}
        }
        return Reflect.get(target, property, receiver)
      },
    })
  }

  function getSubgoal(state: QuestsState, questId: number, subgoalId: GoalKey): SubgoalRecord {
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
      ships: Record<string, { api_ship_id?: number; api_stype?: number }>
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
      // @ts-expect-error not important for this test, just need some data to verify non-mutation
      1: { detail: { api_no: 1 }, time: 0 },
      // @ts-expect-error not important for this test, just need some data to verify non-mutation
      2: { detail: { api_no: 2 }, time: 0 },
      // @ts-expect-error not important for this test, just need some data to verify non-mutation
      3: { detail: { api_no: 3 }, time: 0 },
      // @ts-expect-error not important for this test, just need some data to verify non-mutation
      4: { detail: { api_no: 4 }, time: 0 },
      // @ts-expect-error not important for this test, just need some data to verify non-mutation
      5: { detail: { api_no: 5 }, time: 0 },
      // @ts-expect-error not important for this test, just need some data to verify non-mutation
      6: { detail: { api_no: 6 }, time: 0 },
      // @ts-expect-error not important for this test, just need some data to verify non-mutation
      7: { detail: { api_no: 7 }, time: 0 },
      // @ts-expect-error not important for this test, just need some data to verify non-mutation
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

  it('creates quest records from quest goals without reading constructor.prototype', () => {
    const questGoal: QuestsState['questGoals'][number] = {
      practice: { required: 1 },
    }
    Object.defineProperty(questGoal, 'constructor', {
      value: createPrototypeInvariantConstructor(),
    })
    const questState: QuestsState = {
      ...baseState,
      records: {},
      activeQuests: {},
      questGoals: {
        9: questGoal,
      },
    }
    const store = createTestStore(questState)
    const payload = {
      method: 'GET',
      path: '/kcsapi/api_get_member/questlist',
      body: {
        api_completed_kind: 0,
        api_count: 1,
        api_exec_count: 1,
        api_exec_type: 0,
        api_list: [
          {
            api_bonus_flag: 0,
            api_category: 1,
            api_detail: '',
            api_get_material: [0, 0, 0, 0],
            api_invalid_flag: 0,
            api_no: 9,
            api_progress_flag: 0,
            api_state: 2,
            api_title: 'test quest',
            api_type: 1,
            api_voice_id: 0,
          },
        ],
      },
      postBody: { api_tab_id: '0', api_verno: '1' },
      time: 0,
    } satisfies PayloadOf<typeof createAPIGetMemberQuestlistResponseAction>

    store.dispatch(createAPIGetMemberQuestlistResponseAction(payload))

    const after = store.getState().info.quests
    expect(getSubgoal(after, 9, 'practice').count).toBe(0)
    expect(getSubgoal(after, 9, 'practice').required).toBe(1)
    expect(after.activeQuests[9]?.detail.api_no).toBe(9)
  })

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

  it('destory_item counts by slotitemId', () => {
    const questState: QuestsState = {
      ...baseState,
      records: {
        ...baseState.records,
        9: { id: 9, destory_item: { count: 0, required: 3 } },
      },
      activeQuests: {
        ...baseState.activeQuests,
        // @ts-expect-error not important for this test
        9: { detail: { api_no: 9 }, time: 0 },
      },
      questGoals: {
        ...baseState.questGoals,
        9: { destory_item: { required: 3, slotitemId: [10] } },
      },
    }
    const store = createTestStore(questState, {
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
        $equips: { 10: { api_type: [0, 0, 2] } },
      },
    })

    const payload = destroyItemFixture satisfies PayloadOf<
      typeof createAPIReqKousyouDestroyitem2ResponseAction
    >
    store.dispatch(createAPIReqKousyouDestroyitem2ResponseAction(payload))

    const after = store.getState().info.quests
    expect(getSubgoal(after, 9, 'destory_item').count).toBe(3)
  })

  it('remodel_ship counts unconstrained quest once per modernization', () => {
    const questState: QuestsState = {
      ...baseState,
      records: {
        ...baseState.records,
        9: { id: 9, remodel_ship: { count: 0, required: 2 } },
      },
      activeQuests: {
        ...baseState.activeQuests,
        // @ts-expect-error not important for this test
        9: { detail: { api_no: 9 }, time: 0 },
      },
      questGoals: {
        ...baseState.questGoals,
        9: { remodel_ship: { required: 2, times: [1] } },
      },
    }
    const store = createTestStore(questState, {
      info: {
        ships: {
          28343: { api_stype: 3 },
          28338: { api_stype: 3 },
        },
      },
    })

    const payload = powerupFixture satisfies PayloadOf<
      typeof createAPIReqKaisouPowerupResponseAction
    >
    store.dispatch(createAPIReqKaisouPowerupResponseAction(payload))

    const after = store.getState().info.quests
    expect(getSubgoal(after, 9, 'remodel_ship').count).toBe(1)
  })

  it('battle_boss_win secondshipclass — gates on second ship ctype', () => {
    const questState: QuestsState = {
      ...baseState,
      records: {
        ...baseState.records,
        9: { id: 9, battle_boss_win_rank_s: { count: 0, required: 1 } },
      },
      activeQuests: {
        ...baseState.activeQuests,
        // @ts-expect-error not important for this test
        9: { detail: { api_no: 9 }, time: 0 },
      },
      questGoals: {
        ...baseState.questGoals,
        9: {
          battle_boss_win_rank_s: {
            required: 1,
            maparea: [75],
            mapcell: [24, 25],
            flagship: ['吹雪改三'],
            secondshipclass: [12], // 特I型
          },
        },
      },
    }
    const store = createTestStore(questState)

    // second ship is not 特I型 (ctype 1 = 綾波型) — no progress
    store.dispatch(
      createInfoQuestsApplyProgressAction({
        event: 'battle_boss_win_rank_s',
        options: {
          maparea: 75,
          mapcell: 24,
          shipname: ['吹雪改三', '綾波改二'],
          shiptype: [2, 2],
          shipclass: [12, 1],
        },
        delta: 1,
      }),
    )
    expect(getSubgoal(store.getState().info.quests, 9, 'battle_boss_win_rank_s').count).toBe(0)

    // 吹雪改三護(六式) flagship matches by substring; second ship 特I型 (ctype 12) counts
    store.dispatch(
      createInfoQuestsApplyProgressAction({
        event: 'battle_boss_win_rank_s',
        options: {
          maparea: 75,
          mapcell: 25,
          shipname: ['吹雪改三護(六式)', '白雪改'],
          shiptype: [2, 2],
          shipclass: [12, 12],
        },
        delta: 1,
      }),
    )
    expect(getSubgoal(store.getState().info.quests, 9, 'battle_boss_win_rank_s').count).toBe(1)
  })

  it('remodel_ship materialShipType combined count — passes when ≥ materialShipMinCount match', () => {
    const questState: QuestsState = {
      ...baseState,
      records: {
        ...baseState.records,
        9: { id: 9, remodel_ship: { count: 0, required: 2 } },
      },
      activeQuests: {
        ...baseState.activeQuests,
        // @ts-expect-error not important for this test
        9: { detail: { api_no: 9 }, time: 0 },
      },
      questGoals: {
        ...baseState.questGoals,
        9: {
          remodel_ship: { required: 2, materialShipType: [3, 4, 21], materialShipMinCount: 3 },
        },
      },
    }
    const store = createTestStore(questState)

    // 3 CL-class ships as material — satisfies minCount=3
    store.dispatch(
      createInfoQuestsApplyProgressAction({
        event: 'remodel_ship',
        options: { times: 1, materialShipTypes: [3, 4, 21] },
        delta: 1,
      }),
    )
    expect(getSubgoal(store.getState().info.quests, 9, 'remodel_ship').count).toBe(1)

    // only 2 matching — does not satisfy minCount=3
    store.dispatch(
      createInfoQuestsApplyProgressAction({
        event: 'remodel_ship',
        options: { times: 1, materialShipTypes: [3, 3] },
        delta: 1,
      }),
    )
    expect(getSubgoal(store.getState().info.quests, 9, 'remodel_ship').count).toBe(1)

    // mixed class with 3 matching total (1 CL + 1 CLT + 1 練巡) — satisfies minCount=3
    store.dispatch(
      createInfoQuestsApplyProgressAction({
        event: 'remodel_ship',
        options: { times: 1, materialShipTypes: [3, 4, 21, 5] },
        delta: 1,
      }),
    )
    expect(getSubgoal(store.getState().info.quests, 9, 'remodel_ship').count).toBe(2)
  })
})

describe('outdateRecords', () => {
  // The shapes that actually ship in quest_goal.cson: a one-time (単発) quest carries
  // no type, one with a same-day count adds resetInterval, and periodic quests carry
  // the type of their period.
  const goals: QuestsState['questGoals'] = {
    1052: { battle_boss_win_rank_s: { required: 2 } }, // one-time
    313: { resetInterval: 1, practice_win: { required: 8 } }, // one-time, daily count
    854: { type: 4, battle_boss_win_rank_s: { required: 2 } }, // quarterly
    1167: { type: 2, resetInterval: 1, remodel_item: { required: 3 } }, // weekly, daily count
  }
  const records: Record<string | number, QuestRecord> = {
    1052: { id: 1052, battle_boss_win_rank_s: { count: 1, required: 2 } },
    313: { id: 313, practice_win: { count: 5, required: 8 } },
    854: { id: 854, battle_boss_win_rank_s: { count: 1, required: 2 } },
    1167: { id: 1167, remodel_item: { count: 2, required: 3 } },
  }
  const at = (date: string) => +moment.tz(`${date} 06:00`, 'Asia/Tokyo')

  spec('keeps one-time records across every rollover, resets the periodic ones', () => {
    // a year on: a different day, week, month, quarter and every yearly boundary
    const outdated = outdateRecords(goals, records, at('2026-09-12'), at('2027-09-12'))

    // no type: the progress of a quest that is still open is never thrown away
    expect(outdated[1052]).toEqual(records[1052])
    // ...and a one-time quest with a daily count keeps its record, count zeroed
    expect(outdated[313]).toEqual({ id: '313', practice_win: { count: 0, required: 8 } })
    // a reset type wins over resetInterval, so these are dropped outright and the
    // next questlist response re-creates them from the goals
    expect(outdated[854]).toBeUndefined()
    expect(outdated[1167]).toBeUndefined()
  })

  spec('resets only the daily counters when the day changes', () => {
    const outdated = outdateRecords(goals, records, at('2026-09-12'), at('2026-09-13'))

    expect(outdated[1052]).toEqual(records[1052])
    expect(outdated[854]).toEqual(records[854])
    expect(outdated[313]?.practice_win).toEqual({ count: 0, required: 8 })
    expect(outdated[1167]?.remodel_item).toEqual({ count: 0, required: 3 })
  })

  spec('never resets a one-time record, stepped day by day across a whole year', () => {
    // brute force rather than sampled boundaries: every day, week, month, Tanaka
    // quarter and all 12 yearly resets are crossed somewhere in this loop
    let carried = records
    let previous = at('2026-09-12')
    for (let day = 1; day <= 400; day += 1) {
      const next = previous + ONE_DAY
      carried = outdateRecords(goals, carried, previous, next)
      previous = next
      // the one-time record is still there, with its count intact
      expect(carried[1052]).toEqual(records[1052])
      // ...and the one with a daily count keeps its record too
      expect(carried[313]?.practice_win).toEqual({ count: 0, required: 8 })
    }
  })

  spec('leaves everything alone within the same quest day', () => {
    // 05:00 JST is the boundary, so 06:00 and 23:00 are the same quest day
    const outdated = outdateRecords(
      goals,
      records,
      at('2026-09-12'),
      +moment.tz('2026-09-12 23:00', 'Asia/Tokyo'),
    )
    expect(outdated).toEqual(records)
  })
})

describe('outdateActiveQuests', () => {
  // Expiry keys off the *game's* api_type in the quest detail, not the cson type; the
  // rest of the payload is filler so the fixture is a real APIList.
  const active = (
    api_no: number,
    api_type: number,
    api_label_type: number,
    time: number,
  ): ActiveQuest => ({
    detail: {
      api_no,
      api_type,
      api_label_type,
      api_state: 2,
      api_progress_flag: 0,
      api_title: `quest ${api_no}`,
      api_detail: '',
      api_category: 1,
      api_bonus_flag: 1,
      api_invalid_flag: 0,
      api_get_material: [0, 0, 0, 0],
      api_voice_id: 0,
    },
    time,
  })
  const at = (date: string) => +moment.tz(`${date} 06:00`, 'Asia/Tokyo')
  const then = at('2026-09-12')
  const quests = {
    1052: active(1052, 4, 1, then), // one-time
    201: active(201, 1, 2, then), // daily
    242: active(242, 2, 3, then), // weekly
    249: active(249, 3, 6, then), // monthly
    854: active(854, 5, 7, then), // quarterly
    1050: active(1050, 5, 109, then), // yearly (September)
  }

  spec('keeps a one-time quest active through every date change', () => {
    for (const date of ['2026-09-13', '2026-09-20', '2026-10-12', '2027-09-12']) {
      expect(outdateActiveQuests(quests, at(date))[1052]).toEqual(quests[1052])
    }
  })

  spec('drops a daily on the next day and a weekly on the next week', () => {
    const nextDay = outdateActiveQuests(quests, at('2026-09-13'))
    expect(nextDay[201]).toBeUndefined()
    expect(nextDay[242]).toEqual(quests[242])

    const nextWeek = outdateActiveQuests(quests, at('2026-09-20'))
    expect(nextWeek[242]).toBeUndefined()
    expect(nextWeek[249]).toEqual(quests[249])
  })

  spec('drops a monthly next month and a yearly after its reset month', () => {
    expect(outdateActiveQuests(quests, at('2026-10-12'))[249]).toBeUndefined()
    expect(outdateActiveQuests(quests, at('2027-09-12'))[1050]).toBeUndefined()
  })
})

describe('satisfyShip — id-based ship constraints', () => {
  // What the middleware passes: for each fleet ship, every master id it counts as
  // (its own plus every id it can have been remodelled from).
  const VERNY = [147, 235, 35] // Верный <- 響改 <- 響
  const MICHISHIO = [489, 250, 97] // 満潮改二 <- 満潮改 <- 満潮
  const USHIO_BASE = [16] // 潮, unremodelled
  const USHIO_KAI2 = [407, 233, 16] // 潮改二 <- 潮改 <- 潮

  spec('matches a renamed remodel through its base id', () => {
    // 響 = 35; Верный is the same ship two remodels on, and shares no substring
    expect(satisfyShip({ required: 1, escortshipId: [[[35], 1]] }, { shipIds: [VERNY] })).toBe(true)
  })

  spec('does not match a different ship whose name merely contains the same characters', () => {
    // the substring bug this replaces: '潮' used to count 満潮 as well
    expect(satisfyShip({ required: 1, escortshipId: [[[16], 1]] }, { shipIds: [MICHISHIO] })).toBe(
      false,
    )
  })

  spec('counts a remodel at or after the named id, and nothing before it', () => {
    const kaiOrLater: QuestsState['questGoals'][number][GoalKey] = {
      required: 1,
      escortshipId: [[[233], 1]], // 潮改
    }
    expect(satisfyShip(kaiOrLater, { shipIds: [USHIO_KAI2] })).toBe(true)
    expect(satisfyShip(kaiOrLater, { shipIds: [USHIO_BASE] })).toBe(false)
  })

  spec('escortshipId entries are OR-ed, like escortship', () => {
    const goal: QuestsState['questGoals'][number][GoalKey] = {
      required: 1,
      escortshipId: [
        [[35], 1], // 響
        [[16], 1], // 潮
      ],
    }
    expect(satisfyShip(goal, { shipIds: [VERNY, USHIO_KAI2] })).toBe(true)
    // one entry is enough: 響 alone passes, 満潮 alone does not
    expect(satisfyShip(goal, { shipIds: [VERNY, MICHISHIO] })).toBe(true)
    expect(satisfyShip(goal, { shipIds: [MICHISHIO] })).toBe(false)
  })

  spec('escortshipIdAll entries must all hold, like escortshiptype', () => {
    const goal: QuestsState['questGoals'][number][GoalKey] = {
      required: 1,
      escortshipIdAll: [
        [[35], 1], // 響
        [[16], 1], // 潮
      ],
    }
    expect(satisfyShip(goal, { shipIds: [VERNY, USHIO_KAI2] })).toBe(true)
    expect(satisfyShip(goal, { shipIds: [VERNY, MICHISHIO] })).toBe(false)
  })

  spec('takes either escort group — the OR quest 903 relies on', () => {
    // 夕張改二 flagship + (由良改二 ×1 OR 睦月型 ×2)
    const goal: QuestsState['questGoals'][number][GoalKey] = {
      required: 1,
      flagshipId: [622],
      escortshipId: [
        [[488], 1], // 由良改二
        [[1, 2], 2], // 睦月/如月
      ],
    }
    const YUBARI = [622] // 夕張改二
    const YURA = [488] // 由良改二
    const MUTSUKI = [434, 254, 1] // 睦月改二 <- 睦月改 <- 睦月
    const KISARAGI = [435, 255, 2]
    expect(satisfyShip(goal, { shipIds: [YUBARI, YURA] })).toBe(true)
    expect(satisfyShip(goal, { shipIds: [YUBARI, MUTSUKI, KISARAGI] })).toBe(true)
    expect(satisfyShip(goal, { shipIds: [YUBARI, MUTSUKI] })).toBe(false)
  })

  spec('accepts a switchable variant of the named remodel, but never a pre-改 ship', () => {
    // 夕張(115) -> 夕張改(293) -> 夕張改二(622) -> 改二特(623) -> 改二丁(624) -> 622
    const goal: QuestsState['questGoals'][number][GoalKey] = { required: 1, flagshipId: [622] }
    const KAI_NI_TOKU = [623, 622, 624, 293, 115] // what 夕張改二特 counts as
    const KAI = [293, 115] // 夕張改
    const BASE = [115] // 夕張
    expect(satisfyShip(goal, { shipIds: [KAI_NI_TOKU] })).toBe(true)
    expect(satisfyShip(goal, { shipIds: [KAI] })).toBe(false)
    expect(satisfyShip(goal, { shipIds: [BASE] })).toBe(false)
  })

  spec('gates flagship and second ship by position', () => {
    const goal: QuestsState['questGoals'][number][GoalKey] = {
      required: 1,
      flagshipId: [35],
      secondshipId: [16],
    }
    expect(satisfyShip(goal, { shipIds: [VERNY, USHIO_KAI2] })).toBe(true)
    expect(satisfyShip(goal, { shipIds: [USHIO_KAI2, VERNY] })).toBe(false)
  })

  spec('ignores the flagship when an entry says so', () => {
    const goal: QuestsState['questGoals'][number][GoalKey] = {
      required: 1,
      escortshipId: [[[35], 1, true]],
    }
    expect(satisfyShip(goal, { shipIds: [VERNY, USHIO_KAI2] })).toBe(false)
    expect(satisfyShip(goal, { shipIds: [USHIO_KAI2, VERNY] })).toBe(true)
  })
})

describe('shipRemodelSources', () => {
  // 潮 -> 潮改 -> 潮改二, and a switchable pair that points back at itself
  const $ships: RemodelRoster = {
    16: { api_id: 16, api_aftershipid: '233' }, // 潮
    233: { api_id: 233, api_aftershipid: '407' }, // 潮改
    407: { api_id: 407, api_aftershipid: '0' }, // 潮改二
    501: { api_id: 501, api_aftershipid: '506' }, // 最上改二
    506: { api_id: 506, api_aftershipid: '501' }, // 最上改二特
    97: { api_id: 97, api_aftershipid: '0' }, // 満潮
  }

  spec('lists the ship itself and everything it was remodelled from', () => {
    expect(shipRemodelSources(407, $ships).sort()).toEqual([16, 233, 407])
    expect(shipRemodelSources(16, $ships)).toEqual([16])
  })

  spec('keeps a ship with a similar name out of it', () => {
    expect(shipRemodelSources(97, $ships)).toEqual([97])
  })

  spec('terminates on switchable remodels that cycle', () => {
    expect(shipRemodelSources(501, $ships).sort()).toEqual([501, 506])
    expect(shipRemodelSources(506, $ships).sort()).toEqual([501, 506])
  })
})
