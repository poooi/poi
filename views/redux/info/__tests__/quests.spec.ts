import { getTanakalendarQuarterMonth, saveQuestTracking } from '../quests'
import moment from 'moment-timezone'
import { padStart } from 'lodash'
import Scheduler from 'views/services/scheduler'

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
