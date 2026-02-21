import type { Dispatch } from 'redux'

import * as remote from '@electron/remote'
import { createSlice } from '@reduxjs/toolkit'
import { map, sortBy, mapValues, forEach, values, fromPairs, isEqual, range } from 'lodash'
import moment from 'moment-timezone'
import path from 'path'
// @ts-expect-error legacy .es module has no type declarations
import Scheduler from 'views/services/scheduler'
import FileWriter from 'views/utils/file-writer'
import { copyIfSame, arraySum } from 'views/utils/tools'

import {
  createAPIPortPortResponseAction,
  createAPIGetMemberRequireInfoAction,
  createAPIGetMemberQuestlistResponseAction,
  createAPIReqQuestClearitemgetResponseAction,
  createInfoQuestsApplyProgressAction,
  createInfoQuestsDailyRefreshAction,
  type QuestOptions,
} from '../actions'

// Workaround for https://github.com/electron/electron/issues/37404
const CSON = remote.require('cson')

// Type declarations
export interface SubgoalRecord {
  count: number
  required: number
  description?: string
}

export interface QuestRecord {
  id: number | string
  count?: number
  required?: number
  active?: boolean
  time?: number
  [key: string]: SubgoalRecord | number | string | boolean | undefined
}

export interface QuestDetail {
  api_no: number
  api_type?: number
  api_state?: number
  api_progress_flag?: number
  api_label_type?: number
  [key: string]: unknown
}

export interface ActiveQuest {
  detail: QuestDetail
  time: number
}

export interface QuestGoalSubgoal {
  init?: number
  required?: number
  description?: string
  shipType?: number[]
  mission?: string[]
  maparea?: number[]
  slotitemType2?: number[]
  times?: number[]
  mapcell?: number[]
  flagship?: string[]
  secondship?: string[]
  escortship?: [string[], number, boolean][]
  flagshiptype?: number[]
  escortshiptype?: [number[], number, boolean][]
  flagshipclass?: number[]
  escortshipclass?: [number[], number, boolean][]
  fleetlimit?: number
  banshiptype?: number[]
  [key: string]: unknown
}

export interface QuestGoal {
  type?: number
  fuzzy?: boolean
  resetInterval?: number
  [key: string]: QuestGoalSubgoal | number | boolean | undefined
}

export interface QuestsState {
  records: Record<string | number, QuestRecord>
  activeQuests: Record<string | number, ActiveQuest>
  questGoals: Record<string | number, QuestGoal>
  activeCapacity: number
  activeNum: number
}

declare const APPDATA_PATH: string
declare const ROOT: string

function questTrackingPath(admiralId: string): string {
  return path.join(APPDATA_PATH, `quest_tracking_${admiralId}.cson`)
}
const questGoalsPath = path.join(ROOT, 'assets', 'data', 'quest_goal.cson')

// as quests refresh at 5:00 Japan Time (UTC+9), equivalent to 0:00 UTC+4
// for calculation convenience we shift Date object with a 4-hour offset
const FOUR_HOUR_OFFSET = 1000 * 60 * 60 * 4

const QUEST_REFRESH_ZERO = 331200000

const ONE_DAY = 1000 * 60 * 60 * 24

const ONE_WEEK = ONE_DAY * 7

// A UTC+4 timezone without daylight saving
export const ARMENIA_TIMEZONE = 'Asia/Yerevan'

// Remove items from an object where its value doesn't satisfy `pred`.
// The argument `obj` IS MODIFIED.
function filterObjectValue<T extends Record<string, unknown>>(
  obj: T,
  pred: (v: unknown) => boolean = Boolean,
): T {
  forEach(obj, (v, k) => {
    if (!pred(v)) {
      delete obj[k]
    }
  })
  return obj
}

function isDifferentDay(time1: number, time2: number): boolean {
  const day1 = Math.floor((time1 + FOUR_HOUR_OFFSET) / ONE_DAY)
  const day2 = Math.floor((time2 + FOUR_HOUR_OFFSET) / ONE_DAY)
  return day1 !== day2
}
function isDifferentWeek(time1: number, time2: number): boolean {
  // UTC time to UTC+4, Jan 1st 1970 is Thursday so make a 4-days padding to ensure the breakpoint of a week is Monday 05:00:00
  const week1 = Math.floor((time1 + FOUR_HOUR_OFFSET - ONE_DAY * 4) / ONE_WEEK)
  const week2 = Math.floor((time2 + FOUR_HOUR_OFFSET - ONE_DAY * 4) / ONE_WEEK)
  return week1 !== week2
}
function isDifferentMonth(time1: number, time2: number): boolean {
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

const isDifferentQuarter = (time1: number, time2: number): boolean =>
  !isEqual(getTanakalendarQuarterMonth(time1)[0], getTanakalendarQuarterMonth(time2)[0])

const getTanakalendarYearlyYear = (time: number, resetMonth: number): number => {
  const y = moment(time).tz(ARMENIA_TIMEZONE).year()
  // yup, month apparently starts at 0
  const m = moment(time).tz(ARMENIA_TIMEZONE).month() + 1
  return m >= resetMonth ? y : y - 1
}

const isDifferentYear = (time1: number, time2: number, resetMonth: number): boolean =>
  getTanakalendarYearlyYear(time1, resetMonth) !== getTanakalendarYearlyYear(time2, resetMonth)

function newQuestRecord(
  id: string | number,
  questGoals: Record<string | number, QuestGoal>,
): QuestRecord | undefined {
  const questGoal = questGoals[id]
  if (!questGoal) return
  const record: QuestRecord = {
    id,
  }
  forEach(questGoal, (v, k) => {
    if (typeof v !== 'object') {
      return
    }
    record[k] = {
      count: (v as QuestGoalSubgoal).init || 0,
      required: (v as QuestGoalSubgoal).required || 0,
      description: (v as QuestGoalSubgoal).description,
    }
  })
  return record
}

function formActiveQuests(activeQuestList: ActiveQuest[] = []): Record<number, ActiveQuest> {
  return fromPairs(activeQuestList.map((quest) => [quest.detail.api_no, quest]))
}

// Remove the oldest from activeQuests so that only n items remain
function limitActiveQuests(
  activeQuests: Record<string | number, ActiveQuest>,
  n: number,
): Record<number, ActiveQuest> {
  if (Object.keys(activeQuests).length <= n) return activeQuests as Record<number, ActiveQuest>
  // Remove the ones with earliest time
  const quests = sortBy(values(activeQuests), 'time')
  quests.splice(0, quests.length - n)
  return formActiveQuests(quests)
}

function resetQuestRecordFactory(types: number[], resetInterval: number) {
  return (questGoals: Record<string | number, QuestGoal>) =>
    (q: QuestRecord | undefined, id: string): QuestRecord | undefined => {
      if (!q || !questGoals[id]) return q
      const questGoal = questGoals[id]
      if (types.includes(parseInt(String(questGoal.type)))) return // This record will be deleted
      if (questGoal.resetInterval === resetInterval) {
        return newQuestRecord(id, questGoals)
      }
      return q
    }
}
const resetQuestRecordDaily = resetQuestRecordFactory([1, 8, 9], 1)
const resetQuestRecordWeekly = resetQuestRecordFactory([2], 2)
const resetQuestRecordMonthly = resetQuestRecordFactory([3], 3)
const resetQuestRecordQuarterly = resetQuestRecordFactory([4], 4)
const resetQuestRecordYearlyFactory = (resetMonth: number) =>
  resetQuestRecordFactory([100 + resetMonth], 5)
function outdateRecords(
  questGoals: Record<string | number, QuestGoal>,
  records: Record<string | number, QuestRecord>,
  then: number,
  now: number,
): Record<string | number, QuestRecord> {
  if (!isDifferentDay(now, then)) {
    return records
  }
  records =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- mapValues preserves Record type
    mapValues(records, resetQuestRecordDaily(questGoals)) as Record<string | number, QuestRecord>
  if (isDifferentWeek(now, then)) {
    records =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- mapValues preserves Record type
      mapValues(records, resetQuestRecordWeekly(questGoals)) as Record<string | number, QuestRecord>
  }
  if (isDifferentMonth(now, then)) {
    records =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- mapValues preserves Record type
      mapValues(records, resetQuestRecordMonthly(questGoals)) as Record<
        string | number,
        QuestRecord
      >
  }
  if (isDifferentQuarter(now, then)) {
    records =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- mapValues preserves Record type
      mapValues(records, resetQuestRecordQuarterly(questGoals)) as Record<
        string | number,
        QuestRecord
      >
  }
  for (const resetMonth of range(1, 13)) {
    if (isDifferentYear(now, then, resetMonth)) {
      records =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- mapValues preserves Record type
        mapValues(records, resetQuestRecordYearlyFactory(resetMonth)(questGoals)) as Record<
          string | number,
          QuestRecord
        >
    }
  }
  return filterObjectValue(records) as Record<string | number, QuestRecord>
}

function filterActiveQuestFactory(now: number) {
  return (activeQuest: Partial<ActiveQuest> = {}): boolean => {
    const { time, detail: { api_type, api_no, api_label_type } = {} } =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Required for destructuring from Partial type
      activeQuest as ActiveQuest
    if (!time || !api_type) return false
    if (!isDifferentDay(now, time)) return true
    // Daily
    if (api_type === 1 || api_no === 211 || api_no === 212) return false
    // Weekly
    if (isDifferentWeek(now, time) && api_type === 2) return false
    // Monthly
    if (isDifferentMonth(now, time) && api_type === 3) return false
    // Yearly
    for (const resetMonth of range(1, 13)) {
      if (
        isDifferentYear(now, time, resetMonth) &&
        api_type === 5 &&
        api_label_type === resetMonth + 100 // Yearly api_label_type = refreshMonth + 100
      ) {
        return false
      }
    }
    return true
  }
}

function outdateActiveQuests(
  activeQuests: Record<string | number, ActiveQuest>,
  now: number,
): Record<number, ActiveQuest> {
  const activeQuestList = values(activeQuests).filter(filterActiveQuestFactory(now))
  if (activeQuestList.length === Object.keys(activeQuests).length)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing when no change
    return activeQuests as Record<number, ActiveQuest>
  return formActiveQuests(activeQuestList)
}

function satisfyGoal(req: string, goal: QuestGoalSubgoal, options: QuestOptions | null): boolean {
  const goalReq =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Goal value can be an array
    goal[req] as unknown[] | undefined
  const unsatisfy =
    goalReq &&
    (!options ||
      !goalReq.includes(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Index access on QuestOptions
        (options as Record<string, unknown>)[req],
      ))
  return !unsatisfy
}

function satisfyShip(
  goal: QuestGoalSubgoal,
  options: QuestOptions & { shipname: string[]; shiptype: number[]; shipclass: number[] },
): boolean {
  if (
    goal.flagship &&
    (options.shipname.length < 1 ||
      !goal.flagship.some((goalName) => options.shipname[0].includes(goalName)))
  ) {
    return false
  }
  if (
    goal.secondship &&
    (options.shipname.length < 2 ||
      !goal.secondship.some((goalName) => options.shipname[1].includes(goalName)))
  ) {
    return false
  }
  if (goal.escortship && goal.escortship.length) {
    let flag = false
    for (const [goalNames, goalCount, ignoreFlagShip] of goal.escortship) {
      const shipname = ignoreFlagShip ? options.shipname.slice(1) : options.shipname
      const count = shipname.filter((optionShipName) =>
        goalNames.some((goalName) => optionShipName.includes(goalName)),
      ).length
      if (count >= goalCount) {
        flag = true
      }
    }
    if (!flag) {
      return false
    }
  }
  if (goal.flagshiptype && !goal.flagshiptype.includes(options.shiptype[0])) {
    return false
  }
  if (goal.escortshiptype && goal.escortshiptype.length > 0) {
    for (const [goalType, goalCount, ignoreFlagShip] of goal.escortshiptype) {
      const shiptype = ignoreFlagShip ? options.shiptype.slice(1) : options.shiptype
      const count = shiptype.filter((optionShipType) => goalType.includes(optionShipType)).length
      if (count < goalCount) {
        return false
      }
    }
  }

  if (goal.flagshipclass && !goal.flagshipclass.includes(options.shipclass[0])) {
    return false
  }
  if (goal.escortshipclass && goal.escortshipclass.length > 0) {
    for (const [goalClass, goalCount, ignoreFlagShip] of goal.escortshipclass) {
      const shipclass = ignoreFlagShip ? options.shipclass.slice(1) : options.shipclass
      const count = shipclass.filter((optionShipClass) =>
        goalClass.includes(optionShipClass),
      ).length
      if (count < goalCount) {
        return false
      }
    }
  }
  if (goal.fleetlimit && options.shipname.length > goal.fleetlimit) {
    return false
  }
  if (goal.banshiptype && goal.banshiptype.length > 0) {
    if (goal.banshiptype.some((goalType) => options.shiptype.includes(goalType))) {
      return false
    }
  }
  return true
}

// `records` will be modified
function updateQuestRecordFactory(
  records: Record<string | number, QuestRecord>,
  activeQuests: Record<string | number, ActiveQuest>,
  questGoals: Record<string | number, QuestGoal>,
) {
  return (event: string, options: QuestOptions | null, delta: number): boolean => {
    let changed = false
    forEach(activeQuests, (activeQuest) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Default empty object for destructuring
      const quest = (activeQuest || ({} as ActiveQuest)).detail
      if (typeof quest !== 'object') return
      const { api_no } = quest
      const record = records[api_no]
      const goal = questGoals[api_no] || {}
      let match: string[] = []
      if (!api_no || !record) {
        return
      }
      if (goal.fuzzy) {
        // 'fuzzy' will also appears in Object.keys(goal)
        // use @ as separator because we could have battle_boss_win and battle_boss_win_s
        match = Object.keys(goal).filter((x) => x.startsWith(`${event}@`))
      }
      forEach([...match, event], (_event) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const subgoal = goal[_event] as QuestGoalSubgoal | undefined
        if (!subgoal) {
          return
        }
        if (!satisfyGoal('shipType', subgoal, options)) return
        if (!satisfyGoal('mission', subgoal, options)) return
        if (!satisfyGoal('maparea', subgoal, options)) return
        if (!satisfyGoal('slotitemType2', subgoal, options)) return
        if (!satisfyGoal('times', subgoal, options)) return
        if (!satisfyGoal('mapcell', subgoal, options)) return
        const shipOptions = {
          shipname: options?.shipname || [],
          shiptype: options?.shiptype || [],
          shipclass: options?.shipclass || [],
        }
        if (!satisfyShip(subgoal, { ...options, ...shipOptions })) return
        const existing = record[_event]
        if (!existing || typeof existing !== 'object') {
          return
        }
        const existingSubrecord = existing as Partial<SubgoalRecord>
        if (
          typeof existingSubrecord.count !== 'number' ||
          typeof existingSubrecord.required !== 'number' ||
          !Number.isFinite(existingSubrecord.count) ||
          !Number.isFinite(existingSubrecord.required)
        ) {
          return
        }
        const subrecord: SubgoalRecord = {
          count: existingSubrecord.count,
          required: existingSubrecord.required,
          description: existingSubrecord.description,
        }
        subrecord.count = Math.min(subrecord.required, subrecord.count + delta)
        records[api_no] = {
          ...record,
          [_event]: subrecord,
        }
        changed = true
      })
    })
    return changed
  }
}

function limitProgress(
  count: number,
  required: number,
  progressFlag: number,
  completed: boolean,
): number {
  if (completed) {
    return required
  }
  switch (progressFlag) {
    case 0: // Empty: [0.0, 0.5)
      return Math.min(count, Math.ceil(required * 0.5) - 1)
    case 1: // 50%: [0.5, 0.8)
      return Math.min(Math.max(count, Math.ceil(required * 0.5)), Math.ceil(required * 0.8) - 1)
    case 2: // 80%: [0.8, 1.0)
      return Math.min(Math.max(count, Math.ceil(required * 0.8)), required - 1)
    default:
      return count
  }
}

// Update progress of existing records
// Returns a new copy of record if it needs updating, or undefined o/w
function updateRecordProgress(record: QuestRecord, bodyQuest: QuestDetail): QuestRecord {
  const { api_progress_flag, api_state } = bodyQuest
  let subgoalKey: string | null = null
  forEach(record, (v, k) => {
    if (typeof v === 'object') {
      if (subgoalKey == null) {
        subgoalKey = k
      } else {
        // Only update if this quest has only 1 subgoal
        subgoalKey = null
        return false // break
      }
    }
  })
  if (subgoalKey !== null) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- subgoalKey corresponds to SubgoalRecord type
    const subgoal = record[subgoalKey] as SubgoalRecord
    const count = limitProgress(
      subgoal.count,
      subgoal.required,
      api_progress_flag || 0,
      api_state === 3,
    )
    if (count !== subgoal.count) {
      return {
        ...record,
        [subgoalKey]: {
          ...subgoal,
          count,
        },
      }
    }
  }
  return record
}

const initState: QuestsState = {
  records: {}, // {<questId>: {<subgoalName>: {count:, required:, description: }}}
  activeQuests: {}, // {<questId>: {detail: <quest>, time: <unix ms>}}
  questGoals: {}, // {<questId>: {type:, <subgoalName>: {init:, required:, description: }}}
  activeCapacity: 5,
  activeNum: 0,
}

const questsSlice = createSlice({
  name: 'quests',
  initialState: initState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createAPIGetMemberRequireInfoAction, (state, action) => {
        const admiralIdRaw = action.payload.body.api_basic?.api_member_id
        if (admiralIdRaw == null) return
        const admiralId = String(admiralIdRaw)

        // Load static quest goal data
        let questGoals: Record<string | number, QuestGoal> = {}
        try {
          questGoals = JSON.parse(JSON.stringify(CSON.parseCSONFile(questGoalsPath)))
        } catch (_e) {
          console.warn('No quest goal data!')
        }

        // Load quest tracking of this account
        let records: Record<string | number, QuestRecord> & { time?: number } = {}
        try {
          records = JSON.parse(
            JSON.stringify(CSON.parseCSONFile(questTrackingPath(String(admiralId)))),
          )
          if (records && typeof records.time === 'number') {
            records = outdateRecords(
              questGoals,
              records,
              records.time,
              Date.now(),
            ) as typeof records
          }
        } catch (_e) {
          console.warn('No quest tracking data!')
        }
        delete records.time // Time is added ad-hoc upon saving

        state.records = records
        state.questGoals = questGoals
        state.activeQuests = outdateActiveQuests(state.activeQuests, Date.now())
      })
      .addCase(createInfoQuestsDailyRefreshAction, (state, action) => {
        const now = action.payload.now
        const halfHour = 30 * 60 * 1000 // Random suitable margin
        state.records = outdateRecords(
          state.questGoals,
          state.records,
          now - halfHour,
          now + halfHour,
        )
        state.activeQuests = outdateActiveQuests(state.activeQuests, now + halfHour)
      })
      .addCase(createAPIPortPortResponseAction, (state, action) => {
        const activeCapacity = Number(action.payload.body.api_parallel_quest_count)
        if (!Number.isFinite(activeCapacity) || activeCapacity <= 0) return
        state.activeCapacity = activeCapacity
        if (Object.keys(state.activeQuests).length > activeCapacity) {
          state.activeQuests = limitActiveQuests(state.activeQuests, activeCapacity)
        }
      })
      .addCase(createAPIGetMemberQuestlistResponseAction, (state, action) => {
        const body = action.payload.body
        const activeNum = Number(body.api_exec_count) || 0
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- State type narrowing
        let activeQuests = state.activeQuests as Record<string | number, ActiveQuest>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- State type narrowing
        let records = state.records as Record<string | number, QuestRecord>
        const questGoals = state.questGoals
        const now = Date.now()

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API response type definition
        ;((body as { api_list?: unknown[] }).api_list || []).forEach((quest) => {
          if (!quest || typeof quest !== 'object') return
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing after check
          const q = quest as QuestDetail
          const api_state = Number(q.api_state)
          const api_no = q.api_no
          if (api_no == null) return

          let record = records[api_no]
          if (!record && questGoals[api_no]) {
            const created = newQuestRecord(api_no, questGoals)
            if (created) record = created
          }

          if (record) {
            const updated = updateRecordProgress(record, q)
            if (updated !== records[api_no]) {
              records = copyIfSame(records, state.records)
              records[api_no] = updated
            }
          }

          // Active quests
          activeQuests = copyIfSame(activeQuests, state.activeQuests)
          if (api_state >= 2) {
            activeQuests[api_no] = { detail: q, time: now }
          } else {
            delete activeQuests[api_no]
          }
        })

        state.activeNum = activeNum
        state.records = records
        state.activeQuests = limitActiveQuests(activeQuests, activeNum)
      })
      .addCase(createAPIReqQuestClearitemgetResponseAction, (state, action) => {
        const api_quest_id = action.payload.postBody.api_quest_id
        if (api_quest_id == null) return

        state.activeNum = Math.max(0, state.activeNum - 1)

        if (api_quest_id in state.records) {
          const records = { ...state.records }
          delete records[api_quest_id]
          state.records = records
        }
        if (api_quest_id in state.activeQuests) {
          const activeQuests = { ...state.activeQuests }
          delete activeQuests[api_quest_id]
          state.activeQuests = activeQuests
        }
      })
      .addCase(createInfoQuestsApplyProgressAction, (state, action) => {
        const { event, options, delta } = action.payload

        const updateQuestRecord = updateQuestRecordFactory(
          state.records,
          state.activeQuests,
          state.questGoals,
        )
        updateQuestRecord(event, options, delta)
      })
  },
})

export const reducer = questsSlice.reducer

export function schedualDailyRefresh(dispatch: Dispatch): void {
  const now = Date.now()
  // eslint-disable-next-line no-console
  console.log('Scheduling daily refresh at %d (now %d)', QUEST_REFRESH_ZERO, Date.now())
  Scheduler.schedule(
    (time: number) => {
      // TODO: Debug
      // eslint-disable-next-line no-console
      console.log('Daily refresh at %d scheduled at %d (now %d)', time, now, Date.now())
      dispatch(createInfoQuestsDailyRefreshAction({ now: time }))
    },
    {
      time: QUEST_REFRESH_ZERO, // TODO: this value has no effect here
      interval: ONE_DAY,
      allowImmediate: false,
    },
  )
}

interface ProcessedRecords extends Record<string, unknown> {
  time: number
}

function processQuestRecords(
  records: Record<string | number, QuestRecord>,
  activeQuests: Record<string | number, ActiveQuest>,
): ProcessedRecords {
  // Deep clone to avoid mutating redux state objects from a store subscriber.
  // This matches the legacy behavior where only the serialized file copy is updated.
  const newRecords = structuredClone(records)
  forEach(newRecords, (record, recordId) => {
    if (!record || typeof record !== 'object') return
    const [count, required] = arraySum(
      map(record, (subgoal) => {
        if (!subgoal || typeof subgoal !== 'object') return [0, 0]
        return [(subgoal as SubgoalRecord).count || 0, (subgoal as SubgoalRecord).required || 0]
      }),
    )
    record.count = count || 0
    record.required = required || 1
    if (recordId in activeQuests) {
      record.active = true
    } else {
      delete record.active
    }
  })
  return { ...newRecords, time: Date.now() } as ProcessedRecords
}

const fileWriter = new FileWriter()

declare global {
  interface Window {
    getStore: (path: string) => unknown
  }
}

// Subscriber, used after the store is created
// Need to observe on state quests.records
export function saveQuestTracking(records: Record<string | number, QuestRecord>): void {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const { activeQuests } = window.getStore('info.quests') as {
    activeQuests: Record<string | number, ActiveQuest>
  }
  const admiralId = String(window.getStore('info.basic.api_member_id') ?? '')
  fileWriter.write(
    questTrackingPath(admiralId),
    CSON.stringify(processQuestRecords(records, activeQuests)),
    'utf8',
  )
}
