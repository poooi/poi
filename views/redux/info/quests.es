import reduceReducers from 'reduce-reducers'
import CSON from 'cson'
import {join} from 'path-extra'
import {sortBy, mapValues, forEach, values, fromPairs} from 'lodash'
import {observer, observe} from 'redux-observers'
import {writeFile} from 'fs-extra'

const {ROOT, APPDATA_PATH} = window

const QUESTS_REFRESH_DAY = '@@QUESTS_REFRESH_DAY'

function questTrackingPath(admiralId) {
  return join(APPDATA_PATH, `quest_tracking_${admiralId}.cson`)
}
const questGoalsPath = join(ROOT, 'assets', 'data', 'quest_goal.cson')

// Remove items from an object where its value doesn't satisfy `pred`.
// The argument `obj` IS MODIFIED.
function filterObjectValue(obj, pred=Boolean) {
  forEach(obj, (v, k) => {
    if (!pred(v)) {
      delete obj[k]
    }
  })
  return obj
}

function copyIfSame(obj, to) {
  // assert(typeof obj === 'object')
  if (obj === to)
    return Array.isArray(obj) ? obj.slice() : {...obj}
  return obj
}

// Assert one of a and b is a number, and the other is a string
function stringNumberEqual(a, b) {
  if (typeof a === 'string')
    [a, b] = [b, a]
  b = parseFloat(b)
  return a == b
}

// Update all key/val pair of items into obj with Object.assign({}, obj, items)
// If non of items needs updating, return the original obj.
// Will handle parseInt.
function updateObject(obj, items) {
  const originalObj = obj
  forEach(items, (v, k) => {
    let thisUpdate
    const typeNew = typeof v
    const typeOld = typeof obj[k]
    if ((typeNew === 'string' && typeOld === 'number')
        || (typeNew === 'number' && typeOld === 'string')) {
      thisUpdate = !stringNumberEqual(v, obj[k])
    } else {
      thisUpdate = v !== obj[k]
    }
    if (thisUpdate) {
      obj = copyIfSame(obj, originalObj)
      obj[k] = v
    }
  })
  return obj
}

const zero = 331200000
function isDifferentDay(time1, time2) {
  const day1 = Math.floor((time1 - zero) / 86400000)
  const day2 = Math.floor((time2 - zero) / 86400000)
  return day1 != day2
}
function isDifferentWeek(time1, time2) {
  const week1 = Math.floor((time1 - zero) / 604800000)
  const week2 = Math.floor((time2 - zero) / 604800000)
  return week1 != week2
}
function isDifferentMonth(time1, time2) {
  // UTC time to UTC+4
  const date1 = new Date(time1 + 14400000)
  const date2 = new Date(time2 + 14400000)
  return date1.getUTCMonth() != date2.getUTCMonth() || date1.getUTCFullYear() != date2.getUTCFullYear()
}

function newQuestRecord(id, questGoals) {
  const questGoal = questGoals[id]
  if (!questGoal)
    return
  const record = {
    id,
  }
  forEach(questGoal, (v, k) => {
    if (typeof v !== 'object') {
      return
    }
    record[k] = {
      count: v.init,
      required: v.required,
      description: v.description,
    }
  })
  return record
}

function formActiveQuests(activeQuestList=[]) {
  return fromPairs(activeQuestList.map((quest) => [quest.detail.api_no, quest]))
}

// Remove the oldest from activeQuests so that only n items remain
function limitActiveQuests(activeQuests, n) {
  if (Object.keys(activeQuests).length <= n)
    return activeQuests
  // Remove the ones with earliest time
  const quests = sortBy(values(activeQuests), 'time')
  quests.splice(0, quests.length - n)
  return formActiveQuests(quests)
}

function resetQuestRecordFactory(types, resetInterval) {
  return (questGoals) => (q, id) => {
    if (!q || !questGoals[id])
      return q
    let questGoal = questGoals[id]
    if (types.indexOf(parseInt(questGoal.type)) != -1)
      return            // This record will be deleted
    if (questGoal.resetInterval == resetInterval) {
      return newQuestRecord(id, questGoals)
    }
    return q
  }
}
const resetQuestRecordDaily = resetQuestRecordFactory([1, 8, 9], 1)
const resetQuestRecordWeekly = resetQuestRecordFactory([2], 2)
const resetQuestRecordMonthly = resetQuestRecordFactory([3], 3)
function outdateRecords(questGoals, records, then, now) {
  if (!isDifferentDay(now, then))
    return records 
  records = mapValues(records, resetQuestRecordDaily(questGoals))
  if (isDifferentWeek(now, then))
    records = mapValues(records, resetQuestRecordWeekly(questGoals))
  if (isDifferentMonth(now, then))
    records = mapValues(records, resetQuestRecordMonthly(questGoals))
  return filterObjectValue(records)
}

function filterActiveQuestFactory(now) {
  return (activeQuest={}) => {
    const {time, detail: {api_type}={}} = activeQuest
    if (!time || !api_type)
      return false
    if (!isDifferentDay(now, time))
      return true
    // Daily
    if (api_type == 1 || api_type == 5) return false
    // Weekly
    if (isDifferentWeek(now, time) && api_type == 2) return false
    // Monthly
    if (isDifferentMonth(now, time) && api_type == 3) return false
    return true
  }
}

function outdateActiveQuests(activeQuests, now) {
  const activeQuestList = values(activeQuests).filter(filterActiveQuestFactory(now))
  if (activeQuestList.length === Object.keys(activeQuests).lenfth)
    return activeQuests
  return formActiveQuests(activeQuestList)
}

function satisfyGoal(req, goal, options) {
  const unsatisfy = goal[req] && (!options || goal[req].indexOf(options[req]) == -1)
  return !unsatisfy
}

// `records` will be modified
function updateQuestRecordFactory(records, activeQuests, questGoals) {
  return (e, options, delta) => {
    let changed = false
    forEach(activeQuests, ({detail: quest}={}) => {
      if (typeof quest !== 'object') return
      let {api_no} = quest
      let record = records[api_no]
      let subgoal = (questGoals[api_no] || {})[e]
      if (!api_no || !record || !subgoal) return
      if (!satisfyGoal('shipType', subgoal, options)) return
      if (!satisfyGoal('mission', subgoal, options)) return
      if (!satisfyGoal('maparea', subgoal, options)) return
      let subrecord = Object.assign(record[e])
      subrecord.count = Math.min(subrecord.required, subrecord.count + delta)
      records[api_no] = {
        ...record,
        [e]: subrecord,
      }
      changed = true
    })
    return changed
  }
}

function questTrackingReducer(state, {type, postBody, body}) {
  const {activeQuests, questGoals} = state
  const records = Object.assign(state.records)
  const updateQuestRecord = updateQuestRecordFactory(records, activeQuests, questGoals)
  switch (type) {
    // type: practice, practice_win
    case '@@Response/kcsapi/api_req_practice/battle_result': {
      let changed = updateQuestRecord('practice', null, 1)
      if (['S', 'A', 'B'].indexOf(body.api_win_rank) != -1)
        changed = updateQuestRecord('practice_win', null, 1) || changed 
      if (changed) {
        return {
          ...state,
          records,
        }
      }
      break
    }
    // type: mission_success
    case '@@Response/kcsapi/api_req_mission/result':
      if (body.api_clear_result > 0)
        if (updateQuestRecord('mission_success', {mission: body.api_quest_name}, 1))
          return {...state, records}
      break
    // type: repair
    case '@@Response/kcsapi/api_req_nyukyo/start':
      if (updateQuestRecord('repair', null, 1))
        return {...state, records}
      break
    // type: supply
    case '@@Response/kcsapi/api_req_hokyu/charge':
      if (updateQuestRecord('supply', null, 1))
        return {...state, records}
      break
    // type: create_item
    case '@@Response/kcsapi/api_req_kousyou/createitem':
      if (updateQuestRecord('create_item', null, 1))
        return {...state, records}
      break
    // type: create_ship
    case '@@Response/kcsapi/api_req_kousyou/createship':
      if (updateQuestRecord('create_ship', null, 1))
        return {...state, records}
      break
    // type: destroy_ship
    case '@@Response/kcsapi/api_req_kousyou/destroyship':
      if (updateQuestRecord('destroy_ship', null, 1))
        return {...state, records}
      break
    // type: remodel_item
    case '@@Response/kcsapi/api_req_kousyou/remodel_slot':
      if (updateQuestRecord('remodel_item', null, 1))
        return {...state, records}
      break
    // type: remodel_ship
    case '@@Response/kcsapi/api_req_kaisou/powerup':
      if (body.api_powerup_flag == 1)
        if (updateQuestRecord('remodel_ship', null, 1))
          return {...state, records}
      break
    // type: destory_item
    case '@@Response/kcsapi/api_req_kousyou/destroyitem2':
      if (updateQuestRecord('destory_item', null, 1))
        return {...state, records}
      break
    // type: sally (sortie start)
    case '@@Response/kcsapi/api_req_map/start':
      if (updateQuestRecord('sally', null, 1))
        return {...state, records}
      break
    // type: battle result
    //case '@@Response/kcsapi/api_req_sortie/battleresult': {
  }
  return state
}

const initState = {
  records: {},          // {<questId>: {<subgoalName>: {count:, required:, description: }}}
  activeQuests: {},     // {<questId>: {detail: <quest>, time: <unix ms>}}
  questGoals: {},       // {<questId>: {type:, <subgoalName>: {init:, required:, description: }}}
  activeCapacity: 5,
  activeNum: 0,
}

export function reducer(state=initState, action) {
  // TODO: remove the next if block
  if (Array.isArray(state.activeQuests)) {
    state = {...state, activeQuests: {}}
  }
  const {type, postBody, body} = action
  switch (type) {
    //== Initialization. This takes place once every flash loading ==
    case '@@Response/kcsapi/api_get_member/require_info': {
      const admiralId = body.api_basic.api_member_id
      // Load static quest goal data
      let questGoals = {}
      try {
        questGoals = CSON.parseCSONFile(questGoalsPath)
      } catch (e) {
        console.log('No quest tracking data!')
      }
      // Load quest tracking of this account
      let records = {};
      try {
        records = CSON.parseCSONFile(questTrackingPath(admiralId))
        if (records && records.time) {
          records = outdateRecords(questGoals, records, records.time, Date.now())
        }
      } catch (e) {}
      delete records.time               // Time is added ad-hoc upon saving
      records.admiralId = admiralId     // Used for saving
      return {
        ...state,
        records,
        questGoals,
        activeQuests: outdateActiveQuests(state.activeQuests, Date.now()),
      }
    }

    //== Daily update ==
    case QUESTS_REFRESH_DAY:  {
      let halfHour = 30 * 60 * 1000     // Random suitable margin
      let now = Date.now()
      return {
        ...state,
        records: outdateRecords(questGoals, records, now-halfHour, now+halfHour),
        activeQuests: outdateActiveQuests(activeQuests, now+halfHour),
      }
    }

    //== Update active quests ==
    case '@@Response/kcsapi/api_port/port': {
      let {api_parallel_quest_count: activeCapacity} = body
      let activeQuests = state.activeQuests
      if (Object.keys(state.activeQuests).length > activeCapacity) {
        activeQuests = limitActiveQuests(state.activeQuests, activeCapacity)
      }
      return updateObject(state, {
        activeQuests,
        activeCapacity,
      })
    }

    // Update active quests
    case '@@Response/kcsapi/api_get_member/questlist': {
      const {api_exec_count: activeNum, api_list} = body
      let {activeQuests, records, questGoals} = state
      const now = Date.now()
      ;(api_list || []).forEach((quest) => {
        if (typeof quest !== 'object' || quest.api_state < 2)
          return
        const {api_no} = quest
        // activeQuests
        activeQuests = copyIfSame(activeQuests, state.activeQuests)
        activeQuests[api_no] = {detail: quest, time: now}
        // records
        if (!records[api_no] && questGoals[api_no]) {
          records = copyIfSame(records, state.records)
          records[api_no] = newQuestRecord(api_no, questGoals)
        }
      })
      activeQuests = limitActiveQuests(activeQuests, activeNum)
      return updateObject(state, {
        activeQuests,
        records,
        activeNum,
      })
    }

    // Completed quest
    case '@@Response/kcsapi/api_req_quest/clearitemget': {
      // This api will be followed by a /kcsapi/api_get_member/questlist
      const {api_quest_id} = postBody
      // records
      let {activeQuests, records, activeNum} = state
      activeNum--
      if (api_quest_id in records) {
        records = Object.assign(records)
        delete records[api_quest_id]
      }
      // activeQuests
      if (api_quest_id in activeQuests) {
        activeQuests = {...activeQuests}
        delete activeQuests[api_quest_id]
      }
      // activeCapacity
      let activeCapacity = (body.api_bounus || {}).api_count
      if (typeof activeCapacity === 'undefined')
        activeCapacity = state.activeCapacity
      return updateObject(state, {
        activeNum,
        activeQuests,
        records,
        activeCapacity,
      })
    }

    // Pause quest
    case '@@Response/kcsapi/api_req_quest/stop': {
      // This api will be followed by a /kcsapi/api_get_member/questlist
      const {api_quest_id} = postBody
      let {activeNum, activeQuests} = state
      --activeNum
      if (api_quest_id in state.activeQuests) {
        activeQuests = {...activeQuests}
        delete activeQuests[api_quest_id]
      }
      return updateObject(state, {
        activeQuests,
        activeNum,
      })
    }

  }
  // Update quest count
  return questTrackingReducer(state, action)
}

// Action
export function refreshDay() {
  return {
    type: QUESTS_REFRESH_DAY,
  }
}

// Subscriber, used after the store is created
export function saveQuestTracking(questRecords) {
  writeFile(questTrackingPath(questRecords.admiralId), CSON.stringify({
    ...questRecords,
    time: Date.now(),
  }), null, 2)
}

