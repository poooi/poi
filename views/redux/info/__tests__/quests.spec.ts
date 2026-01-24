import { getTanakalendarQuarterMonth, saveQuestTracking, reducer as questsReducer } from '../quests'
import moment from 'moment-timezone'
import { padStart } from 'lodash'
// @ts-expect-error legacy .es module has no type declarations
import Scheduler from 'views/services/scheduler'

import practiceResultFixture from './__fixtures__/api_req_practice_battle_result_rank_a.json'
import missionResultFixture from './__fixtures__/api_req_mission_result_success.json'
import createItemFixture from './__fixtures__/api_req_kousyou_createitem_success.json'
import remodelSlotFixture from './__fixtures__/api_req_kousyou_remodel_slot_success_consumes_slots.json'
import destroyItemFixture from './__fixtures__/api_req_kousyou_destroyitem2_multiple_slots.json'
import mapStartFixture from './__fixtures__/api_req_map_start_updates_event_gauge_hp.json'
import mapNextFixture from './__fixtures__/api_req_map_next_with_itemget.json'

const responseType = (path: string): string => `@@Response/kcsapi${path.replace(/^\/kcsapi/, '')}`

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
  const baseState = {
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
    const store = {
      sortie: { sortieStatus: [true] },
      info: {
        fleets: { 0: { api_ship: [1] } },
        ships: { 1: { api_ship_id: 1 } },
      },
      const: { $ships: { 1: { api_name: 'A', api_stype: 1, api_ctype: 1 } } },
    }

    const after = questsReducer(
      baseState,
      {
        type: responseType(practiceResultFixture.path),
        body: practiceResultFixture.body,
      },
      store,
    )

    expect((after.records[1] as any).practice.count).toBe(1)
    expect((after.records[2] as any).practice_win.count).toBe(1)
  })

  it('mission_success', () => {
    const after = questsReducer(
      baseState,
      {
        type: responseType(missionResultFixture.path),
        body: missionResultFixture.body,
      },
      {},
    )
    expect((after.records[3] as any).mission_success.count).toBe(1)
  })

  it('create_item increments by api_get_items size', () => {
    const after = questsReducer(
      baseState,
      {
        type: responseType(createItemFixture.path),
        body: createItemFixture.body,
      },
      {},
    )
    expect((after.records[4] as any).create_item.count).toBe(
      createItemFixture.body.api_get_items.length,
    )
  })

  it('remodel_item', () => {
    const after = questsReducer(
      baseState,
      {
        type: responseType(remodelSlotFixture.path),
        body: remodelSlotFixture.body,
        postBody: remodelSlotFixture.postBody,
      },
      {},
    )
    expect((after.records[5] as any).remodel_item.count).toBe(1)
  })

  it('destory_item counts by slotitemType2 + times', () => {
    const store = {
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
        $equips: {
          10: { api_type: [0, 0, 2] },
        },
      },
    }

    const after = questsReducer(
      baseState,
      {
        type: responseType(destroyItemFixture.path),
        postBody: destroyItemFixture.postBody,
      },
      store,
    )

    expect((after.records[6] as any).destory_item.count).toBe(2)
    expect((after.records[6] as any)['destory_item@times'].count).toBe(1)
  })

  it('sally', () => {
    const after = questsReducer(
      baseState,
      {
        type: responseType(mapStartFixture.path),
        body: mapStartFixture.body,
      },
      {},
    )
    expect((after.records[7] as any).sally.count).toBe(1)
  })

  it('reach_mapcell', () => {
    const store = {
      battle: { result: { deckShipId: [1] } },
      info: {
        ships: { 1: { api_ship_id: 1 } },
      },
      const: { $ships: { 1: { api_name: 'A', api_stype: 1, api_ctype: 1 } } },
    }

    const after = questsReducer(
      baseState,
      {
        type: responseType(mapNextFixture.path),
        body: mapNextFixture.body,
      },
      store,
    )
    expect((after.records[8] as any).reach_mapcell.count).toBe(1)
  })
})
