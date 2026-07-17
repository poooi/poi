import { isEqual } from 'lodash'
import moment from 'moment-timezone'

// as quests refresh at 5:00 Japan Time (UTC+9), equivalent to 0:00 UTC+4
// for calculation convenience we shift Date object with a 4-hour offset
const FOUR_HOUR_OFFSET = 1000 * 60 * 60 * 4

export const QUEST_REFRESH_ZERO = 331200000

export const ONE_DAY = 1000 * 60 * 60 * 24

const ONE_WEEK = ONE_DAY * 7

// A UTC+4 timezone without daylight saving
export const ARMENIA_TIMEZONE = 'Asia/Yerevan'

export function isDifferentDay(time1: number, time2: number): boolean {
  const day1 = Math.floor((time1 + FOUR_HOUR_OFFSET) / ONE_DAY)
  const day2 = Math.floor((time2 + FOUR_HOUR_OFFSET) / ONE_DAY)
  return day1 !== day2
}
export function isDifferentWeek(time1: number, time2: number): boolean {
  // UTC time to UTC+4, Jan 1st 1970 is Thursday so make a 4-days padding to ensure the breakpoint of a week is Monday 05:00:00
  const week1 = Math.floor((time1 + FOUR_HOUR_OFFSET - ONE_DAY * 4) / ONE_WEEK)
  const week2 = Math.floor((time2 + FOUR_HOUR_OFFSET - ONE_DAY * 4) / ONE_WEEK)
  return week1 !== week2
}
export function isDifferentMonth(time1: number, time2: number): boolean {
  // UTC time to UTC+4
  const date1 = new Date(time1 + FOUR_HOUR_OFFSET)
  const date2 = new Date(time2 + FOUR_HOUR_OFFSET)
  return (
    date1.getUTCMonth() !== date2.getUTCMonth() || date1.getUTCFullYear() !== date2.getUTCFullYear()
  )
}

// returns [q,m], where q uniquely identifies a Tanaka quarter,
// and m <- [0,1,2] describes the relative month within that quarter.
// Tanaka quater starts from Feb
export const getTanakalendarQuarterMonth = (time: number | Date): [number, number] => {
  const y = moment(time).tz(ARMENIA_TIMEZONE).year()
  // yup, month apparently starts at 0
  const m = moment(time).tz(ARMENIA_TIMEZONE).month() + 1

  const v = y * 12 + m
  return [Math.floor(v / 3), v % 3]
}

export const isDifferentQuarter = (time1: number, time2: number): boolean =>
  !isEqual(getTanakalendarQuarterMonth(time1)[0], getTanakalendarQuarterMonth(time2)[0])

const getTanakalendarYearlyYear = (time: number, resetMonth: number): number => {
  const y = moment(time).tz(ARMENIA_TIMEZONE).year()
  // yup, month apparently starts at 0
  const m = moment(time).tz(ARMENIA_TIMEZONE).month() + 1
  return m >= resetMonth ? y : y - 1
}

export const isDifferentYear = (time1: number, time2: number, resetMonth: number): boolean =>
  getTanakalendarYearlyYear(time1, resetMonth) !== getTanakalendarYearlyYear(time2, resetMonth)
