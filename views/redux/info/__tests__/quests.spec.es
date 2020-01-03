import { getTanakalendarQuarterMonth } from '../quests'

const spec = it

describe('getTanakalendarQuarterMonth', () => {
  spec('sample of a full year', () => {
    const mkDate = (year, month) => new Date(`${year}-${month}`)
    const testCase = (year, month, expected) =>
      expect(getTanakalendarQuarterMonth(mkDate(year, month))).toStrictEqual(expected)

    const qmBase = getTanakalendarQuarterMonth(mkDate(2019, 1))
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
})
