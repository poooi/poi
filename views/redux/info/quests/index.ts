import type { Dispatch } from 'redux'

import { createSlice } from '@reduxjs/toolkit'
import CSON from 'cson'
import { cloneDeep } from 'lodash'
import path from 'path'
import Scheduler from 'views/services/scheduler'
import { copyIfSame } from 'views/utils/tools'

import type { QuestGoal, QuestRecord, QuestsState } from './types'

import {
  createAPIPortPortResponseAction,
  createAPIGetMemberRequireInfoAction,
  createAPIGetMemberQuestlistResponseAction,
  createAPIReqQuestClearitemgetResponseAction,
  createInfoQuestsApplyProgressAction,
  createInfoQuestsDailyRefreshAction,
} from '../../actions'
import { questTrackingPath } from './persistence'
import {
  limitActiveQuests,
  newQuestRecord,
  outdateActiveQuests,
  outdateRecords,
  updateQuestRecordFactory,
  updateRecordProgress,
} from './records'
import { ONE_DAY, QUEST_REFRESH_ZERO } from './time'

// Public surface (kept identical to the former single-file module)
export type {
  GoalKey,
  QuestGoalSubgoal,
  QuestGoal,
  SubgoalRecord,
  QuestRecord,
  ActiveQuest,
  QuestsState,
} from './types'
export { ARMENIA_TIMEZONE, getTanakalendarQuarterMonth } from './time'
export { satisfyShip } from './goal-matching'
export { saveQuestTracking } from './persistence'

const questGoalsPath = path.join(ROOT, 'assets', 'data', 'quest_goal.cson')

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
          questGoals = cloneDeep(CSON.parseCSONFile(questGoalsPath))
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
        let activeQuests = state.activeQuests
        let records = state.records
        const questGoals = state.questGoals
        const now = Date.now()

        ;(body.api_list || []).forEach((quest) => {
          if (!quest || typeof quest !== 'object') return
          const q = quest
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
