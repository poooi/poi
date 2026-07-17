import type { APIList } from 'kcsapi/api_get_member/questlist/response'

import { sortBy, mapValues, forEach, values, fromPairs, range } from 'lodash'

import type { QuestOptions, QuestEvent } from '../../actions'
import type { ActiveQuest, GoalKey, QuestGoal, QuestRecord, SubgoalRecord } from './types'

import { satisfyGoal, satisfyShip } from './goal-matching'
import {
  isDifferentDay,
  isDifferentMonth,
  isDifferentQuarter,
  isDifferentWeek,
  isDifferentYear,
} from './time'

// Remove items from an object where its value doesn't satisfy `pred`.
// The argument `obj` IS MODIFIED.
function filterObjectValue<T>(
  obj: Record<string | number, T>,
): Record<string | number, NonNullable<T>> {
  forEach(obj, (v, k) => {
    if (!v) {
      delete obj[k]
    }
  })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return obj as Record<string | number, NonNullable<T>>
}

export function newQuestRecord(
  id: string | number,
  questGoals: Record<string | number, QuestGoal>,
): QuestRecord | undefined {
  const questGoal = questGoals[id]
  if (!questGoal) return
  const record: QuestRecord = {
    id,
  }
  for (const [k, v] of Object.entries(questGoal)) {
    if (!v || typeof v !== 'object') {
      continue
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    record[k as GoalKey] = {
      count: v.init || 0,
      required: v.required || 0,
      description: v.description,
    }
  }
  return record
}

function formActiveQuests(activeQuestList: ActiveQuest[] = []): Record<number, ActiveQuest> {
  return fromPairs(activeQuestList.map((quest) => [quest.detail.api_no, quest]))
}

// Remove the oldest from activeQuests so that only n items remain
export function limitActiveQuests(
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

export function outdateRecords(
  questGoals: Record<string | number, QuestGoal>,
  records: Record<string | number, QuestRecord | undefined>,
  then: number,
  now: number,
): Record<string | number, QuestRecord> {
  if (!isDifferentDay(now, then)) {
    return filterObjectValue(records)
  }
  records = mapValues(records, resetQuestRecordDaily(questGoals))
  if (isDifferentWeek(now, then)) {
    records = mapValues(records, resetQuestRecordWeekly(questGoals))
  }
  if (isDifferentMonth(now, then)) {
    records = mapValues(records, resetQuestRecordMonthly(questGoals))
  }
  if (isDifferentQuarter(now, then)) {
    records = mapValues(records, resetQuestRecordQuarterly(questGoals))
  }
  for (const resetMonth of range(1, 13)) {
    if (isDifferentYear(now, then, resetMonth)) {
      records = mapValues(records, resetQuestRecordYearlyFactory(resetMonth)(questGoals))
    }
  }
  return filterObjectValue(records)
}

function filterActiveQuestFactory(now: number) {
  return (activeQuest: Partial<ActiveQuest> = {}): boolean => {
    const { time, detail: { api_type, api_no, api_label_type } = {} } = activeQuest
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

export function outdateActiveQuests(
  activeQuests: Record<string | number, ActiveQuest>,
  now: number,
): Record<number, ActiveQuest> {
  const activeQuestList = values(activeQuests).filter(filterActiveQuestFactory(now))
  if (activeQuestList.length === Object.keys(activeQuests).length) return activeQuests
  return formActiveQuests(activeQuestList)
}

// `records` will be modified
export function updateQuestRecordFactory(
  records: Record<string | number, QuestRecord>,
  activeQuests: Record<string | number, ActiveQuest>,
  questGoals: Record<string | number, QuestGoal>,
) {
  return (event: QuestEvent, options: QuestOptions | null, delta: number): boolean => {
    let changed = false
    forEach(activeQuests, (activeQuest) => {
      const quest = activeQuest?.detail
      if (typeof quest !== 'object') return
      const { api_no } = quest
      const record = records[api_no]
      const goal = questGoals[api_no] || {}
      let match: GoalKey[] = []
      if (!api_no || !record) {
        return
      }
      if (goal.fuzzy) {
        // 'fuzzy' will also appears in Object.keys(goal)
        // use @ as separator because we could have battle_boss_win and battle_boss_win_s
        match = Object.keys(goal).filter((x): x is `${QuestEvent}@${string}` =>
          x.startsWith(`${event}@`),
        )
      }
      forEach([...match, event], (_event) => {
        const subgoal = goal[_event]
        if (!subgoal) {
          return
        }
        if (!satisfyGoal('shipType', subgoal, options)) return
        if (!satisfyGoal('mission', subgoal, options)) return
        if (!satisfyGoal('maparea', subgoal, options)) return
        if (!satisfyGoal('slotitemType2', subgoal, options)) return
        if (!satisfyGoal('slotitemId', subgoal, options)) return
        if (subgoal.materialShipType) {
          const validCount =
            options?.materialShipTypes?.filter((t) => subgoal.materialShipType!.includes(t))
              .length ?? 0
          if (validCount < (subgoal.materialShipMinCount ?? 3)) return
        }
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
        const existingSubrecord = existing
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
export function updateRecordProgress(record: QuestRecord, bodyQuest: APIList): QuestRecord {
  const { api_progress_flag, api_state } = bodyQuest
  // Only update if this quest has only 1 subgoal
  const subgoalEntries = Object.entries(record).filter(
    (entry): entry is [string, SubgoalRecord] => typeof entry[1] === 'object',
  )
  if (subgoalEntries.length === 1) {
    const [subgoalKey, subgoal] = subgoalEntries[0]
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
