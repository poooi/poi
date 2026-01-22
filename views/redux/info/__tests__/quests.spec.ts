import { getTanakalendarQuarterMonth } from '../quests'
import moment from 'moment-timezone'
import { padStart } from 'lodash'
import Scheduler from 'views/services/scheduler'
jest.mock('@electron/remote', () => ({ require }))

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
