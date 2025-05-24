/* global ROOT, APPDATA_PATH */
import * as remote from '@electron/remote'
import { join } from 'path-extra'
import {
  map,
  sortBy,
  mapValues,
  forEach,
  values,
  fromPairs,
  countBy,
  get,
  size,
  isEqual,
  range,
} from 'lodash'
import moment from 'moment-timezone'

import FileWriter from 'views/utils/file-writer'
import { copyIfSame, arraySum } from 'views/utils/tools'
import Scheduler from 'views/services/scheduler'

// Workaround for https://github.com/electron/electron/issues/37404
const CSON = remote.require('cson')

const QUESTS_REFRESH_DAY = '@@QUESTS_REFRESH_DAY'

function questTrackingPath(admiralId) {
  return join(APPDATA_PATH, `quest_tracking_${admiralId}.cson`)
}
const questGoalsPath = join(ROOT, 'assets', 'data', 'quest_goal.cson')

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
function filterObjectValue(obj, pred = Boolean) {
  forEach(obj, (v, k) => {
    if (!pred(v)) {
      delete obj[k]
    }
  })
  return obj
}

// Assert one of a and b is a number, and the other is a string
function stringNumberEqual(a, b) {
  if (typeof a === 'string') [a, b] = [b, a]
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
    if (
      (typeNew === 'string' && typeOld === 'number') ||
      (typeNew === 'number' && typeOld === 'string')
    ) {
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

function isDifferentDay(time1, time2) {
  const day1 = Math.floor((time1 + FOUR_HOUR_OFFSET) / ONE_DAY)
  const day2 = Math.floor((time2 + FOUR_HOUR_OFFSET) / ONE_DAY)
  return day1 != day2
}
function isDifferentWeek(time1, time2) {
  // UTC time to UTC+4, Jan 1st 1970 is Thursday so make a 4-days padding to ensure the breakpoint of a week is Monday 05:00:00
  const week1 = Math.floor((time1 + FOUR_HOUR_OFFSET - ONE_DAY * 4) / ONE_WEEK)
  const week2 = Math.floor((time2 + FOUR_HOUR_OFFSET - ONE_DAY * 4) / ONE_WEEK)
  return week1 != week2
}
function isDifferentMonth(time1, time2) {
  // UTC time to UTC+4
  const date1 = new Date(time1 + FOUR_HOUR_OFFSET)
  const date2 = new Date(time2 + FOUR_HOUR_OFFSET)
  return (
    date1.getUTCMonth() != date2.getUTCMonth() || date1.getUTCFullYear() != date2.getUTCFullYear()
  )
}

// returns [q,m], where q uniquely identifies a Tanaka quarter,
// and m <- [0,1,2] describes the relative month within that quarter.
// Tanaka quater starts from Feb
export const getTanakalendarQuarterMonth = (time) => {
  const y = moment(time).tz(ARMENIA_TIMEZONE).year()
  // yup, month apparently starts at 0
  const m = moment(time).tz(ARMENIA_TIMEZONE).month() + 1

  const v = y * 12 + m
  return [Math.floor(v / 3), v % 3]
}

const isDifferentQuarter = (time1, time2) =>
  !isEqual(getTanakalendarQuarterMonth(time1), getTanakalendarQuarterMonth(time2))

const getTanakalendarYearlyYear = (time, resetMonth) => {
  const y = moment(time).tz(ARMENIA_TIMEZONE).year()
  // yup, month apparently starts at 0
  const m = moment(time).tz(ARMENIA_TIMEZONE).month() + 1
  return m >= resetMonth ? y : y - 1
}

const isDifferentYear = (time1, time2, resetMonth) =>
  getTanakalendarYearlyYear(time1, resetMonth) != getTanakalendarYearlyYear(time2, resetMonth)

function newQuestRecord(id, questGoals) {
  const questGoal = questGoals[id]
  if (!questGoal) return
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

function formActiveQuests(activeQuestList = []) {
  return fromPairs(activeQuestList.map((quest) => [quest.detail.api_no, quest]))
}

// Remove the oldest from activeQuests so that only n items remain
function limitActiveQuests(activeQuests, n) {
  if (Object.keys(activeQuests).length <= n) return activeQuests
  // Remove the ones with earliest time
  const quests = sortBy(values(activeQuests), 'time')
  quests.splice(0, quests.length - n)
  return formActiveQuests(quests)
}

function resetQuestRecordFactory(types, resetInterval) {
  return (questGoals) => (q, id) => {
    if (!q || !questGoals[id]) return q
    const questGoal = questGoals[id]
    if (types.includes(parseInt(questGoal.type))) return // This record will be deleted
    if (questGoal.resetInterval == resetInterval) {
      return newQuestRecord(id, questGoals)
    }
    return q
  }
}
const resetQuestRecordDaily = resetQuestRecordFactory([1, 8, 9], 1)
const resetQuestRecordWeekly = resetQuestRecordFactory([2], 2)
const resetQuestRecordMonthly = resetQuestRecordFactory([3], 3)
const resetQuestRecordQuarterly = resetQuestRecordFactory([4], 4)
const resetQuestRecordYearlyFactory = (resetMonth) => resetQuestRecordFactory([100 + resetMonth], 5)
function outdateRecords(questGoals, records, then, now) {
  if (!isDifferentDay(now, then)) {
    return records
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

function filterActiveQuestFactory(now) {
  return (activeQuest = {}) => {
    const { time, detail: { api_type, api_no, api_label_type } = {} } = activeQuest
    if (!time || !api_type) return false
    if (!isDifferentDay(now, time)) return true
    // Daily
    if (api_type == 1 || api_no == 211 || api_no == 212) return false
    // Weekly
    if (isDifferentWeek(now, time) && api_type == 2) return false
    // Monthly
    if (isDifferentMonth(now, time) && api_type == 3) return false
    // Yearly
    for (const resetMonth of range(1, 13)) {
      if (
        isDifferentYear(now, time, resetMonth) &&
        api_type == 5 &&
        api_label_type === resetMonth + 100 // Yearly api_label_type = refreshMonth + 100
      ) {
        return false
      }
    }
    return true
  }
}

function outdateActiveQuests(activeQuests, now) {
  const activeQuestList = values(activeQuests).filter(filterActiveQuestFactory(now))
  if (activeQuestList.length === Object.keys(activeQuests).length) return activeQuests
  return formActiveQuests(activeQuestList)
}

function satisfyGoal(req, goal, options) {
  const unsatisfy = goal[req] && (!options || !goal[req].includes(options[req]))
  return !unsatisfy
}

function satisfyShip(goal, options) {
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
    if (!goal.banshiptype.some((goalType) => options.shiptype.includes(goalType))) {
      return false
    }
  }
  return true
}

// `records` will be modified
function updateQuestRecordFactory(records, activeQuests, questGoals) {
  return (event, options, delta) => {
    let changed = false
    forEach(activeQuests, ({ detail: quest } = {}) => {
      if (typeof quest !== 'object') return
      const { api_no } = quest
      const record = records[api_no]
      const goal = questGoals[api_no] || {}
      let match = []
      if (!api_no || !record) {
        return
      }
      if (goal.fuzzy) {
        // 'fuzzy' will also appears in Object.keys(goal)
        // use @ as separator because we could have battle_boss_win and battle_boss_win_s
        match = Object.keys(goal).filter((x) => x.startsWith(`${event}@`))
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
        if (!satisfyGoal('times', subgoal, options)) return
        if (!satisfyGoal('mapcell', subgoal, options)) return
        if (!satisfyShip(subgoal, options)) return
        const subrecord = { ...record[_event] }
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

function limitProgress(count, required, progressFlag, completed) {
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

function getFleetInfo(deckShipId, store) {
  const shipname = deckShipId
    .map((id) => {
      const shipId = get(store, `info.ships.${id}.api_ship_id`)
      return get(store, `const.$ships.${shipId}.api_name`, '')
    })
    .filter((name) => name.length > 0)
  const shiptype = deckShipId
    .map((id) => {
      const shipId = get(store, `info.ships.${id}.api_ship_id`)
      return get(store, `const.$ships.${shipId}.api_stype`, -1)
    })
    .filter((id) => id > 0)
  const shipclass = deckShipId
    .map((id) => {
      const shipId = get(store, `info.ships.${id}.api_ship_id`)
      return get(store, `const.$ships.${shipId}.api_ctype`, -1)
    })
    .filter((id) => id > 0)
  return { shipname, shiptype, shipclass }
}

// Update progress of existing records
// Returns a new copy of record if it needs updating, or undefined o/w
function updateRecordProgress(record, bodyQuest) {
  const { api_progress_flag, api_state } = bodyQuest
  let subgoalKey = null
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
  if (subgoalKey != null) {
    const subgoal = record[subgoalKey]
    const count = limitProgress(subgoal.count, subgoal.required, api_progress_flag, api_state == 3)
    if (count != subgoal.count) {
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

function questTrackingReducer(state, { type, postBody, body, result }, store) {
  const { activeQuests, questGoals } = state
  const records = { ...state.records }
  const updateQuestRecord = updateQuestRecordFactory(records, activeQuests, questGoals)
  switch (type) {
    // type: practice, practice_win
    case '@@Response/kcsapi/api_req_practice/battle_result': {
      const deckShipId = get(store, 'battle.result.deckShipId', [])
      const { shipname, shiptype, shipclass } = getFleetInfo(deckShipId, store)
      let changed = updateQuestRecord('practice', { shipname, shiptype, shipclass }, 1)
      if (['S', 'A', 'B'].includes(body.api_win_rank)) {
        changed = updateQuestRecord('practice_win', { shipname, shiptype, shipclass }, 1) || changed
      }
      if (['S', 'A'].includes(body.api_win_rank)) {
        changed =
          updateQuestRecord('practice_win_a', { shipname, shiptype, shipclass }, 1) || changed
      }
      if (['S'].includes(body.api_win_rank)) {
        changed =
          updateQuestRecord('practice_win_s', { shipname, shiptype, shipclass }, 1) || changed
      }
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
        if (updateQuestRecord('mission_success', { mission: body.api_quest_name }, 1))
          return { ...state, records }
      break
    // type: repair
    case '@@Response/kcsapi/api_req_nyukyo/start':
      if (updateQuestRecord('repair', null, 1)) return { ...state, records }
      break
    // type: supply
    case '@@Response/kcsapi/api_req_hokyu/charge':
      if (updateQuestRecord('supply', null, 1)) return { ...state, records }
      break
    // type: create_item
    case '@@Response/kcsapi/api_req_kousyou/createitem':
      if (updateQuestRecord('create_item', null, size(body.api_get_items)))
        return { ...state, records }
      break
    // type: create_ship
    case '@@Response/kcsapi/api_req_kousyou/createship':
      if (updateQuestRecord('create_ship', null, 1)) return { ...state, records }
      break
    // type: destroy_ship
    case '@@Response/kcsapi/api_req_kousyou/destroyship':
      if (updateQuestRecord('destroy_ship', null, postBody.api_ship_id.split(',').length))
        return { ...state, records }
      break
    // type: remodel_item
    case '@@Response/kcsapi/api_req_kousyou/remodel_slot':
      if (updateQuestRecord('remodel_item', null, 1)) return { ...state, records }
      break
    // type: remodel_ship
    case '@@Response/kcsapi/api_req_kaisou/powerup':
      if (body.api_powerup_flag == 1)
        if (updateQuestRecord('remodel_ship', null, 1)) return { ...state, records }
      break
    // type: destory_item
    case '@@Response/kcsapi/api_req_kousyou/destroyitem2': {
      // e.g. api_slotitem_ids = "24004,24020"
      const slotitems = postBody.api_slotitem_ids || ''
      const ids = slotitems.split(',')
      // now it only supports gun quest, slotitemType2 = $item.api_type[2]
      const typeCounts = countBy(ids, (id) => {
        const equipId = get(store, `info.equips.${id}.api_slotitem_id`)
        return get(store, `const.$equips.${equipId}.api_type.2`)
      })

      let flag = false
      forEach(Object.keys(typeCounts), (slotitemType2) => {
        flag =
          flag ||
          updateQuestRecord(
            'destory_item',
            { slotitemType2: +slotitemType2 },
            typeCounts[slotitemType2],
          )
      })

      if (updateQuestRecord('destory_item', { times: 1 }, 1) || flag) {
        return { ...state, records }
      }
      break
    }
    // type: sally (sortie start)
    case '@@Response/kcsapi/api_req_map/start':
      if (updateQuestRecord('sally', null, 1)) return { ...state, records }
      break
    // type: reach map point
    case '@@Response/kcsapi/api_req_map/next': {
      const mapcell = body.api_no
      const maparea = body.api_maparea_id * 10 + body.api_mapinfo_no
      const deckShipId = get(store, 'battle.result.deckShipId', [])
      const { shipname, shiptype, shipclass } = getFleetInfo(deckShipId, store)
      if (
        updateQuestRecord('reach_mapcell', { mapcell, maparea, shipname, shiptype, shipclass }, 1)
      )
        return { ...state, records }
      break
    }
    // type: battle result
    case '@@BattleResult': {
      const {
        rank,
        boss,
        map: maparea,
        mapCell: mapcell,
        enemyHp,
        enemyShipId,
        deckShipId,
      } = result
      let flag = false
      const { shipname, shiptype, shipclass } = getFleetInfo(deckShipId, store)
      const battleMeta = {
        shipname,
        shiptype,
        shipclass,
        mapcell,
        maparea,
      }
      flag = updateQuestRecord('battle', battleMeta, 1) || flag
      // type: battle_win
      if (rank === 'S' || rank === 'A' || rank === 'B')
        flag = updateQuestRecord('battle_win', battleMeta, 1) || flag
      // type: battle_rank_s
      if (rank === 'S') flag = updateQuestRecord('battle_rank_s', battleMeta, 1) || flag
      // type: battle_boss
      if (boss) {
        flag = updateQuestRecord('battle_boss', battleMeta, 1) || flag
        // type: battle_boss_win
        if (rank === 'S' || rank === 'A' || rank === 'B')
          flag = updateQuestRecord('battle_boss_win', battleMeta, 1) || flag
        // type: battle_boss_win_rank_a
        if (rank === 'S' || rank === 'A')
          flag = updateQuestRecord('battle_boss_win_rank_a', battleMeta, 1) || flag
        // type: battle_boss_win_rank_s
        if (rank == 'S') flag = updateQuestRecord('battle_boss_win_rank_s', battleMeta, 1) || flag
      }
      // type: sinking
      enemyShipId.forEach((shipId, idx) => {
        if (shipId == -1 || enemyHp[idx] > 0) return
        const shipType = get(store, `const.$ships.${shipId}.api_stype`)
        if ([7, 11, 13, 15].includes(shipType))
          flag = updateQuestRecord('sinking', { shipType: shipType }, 1) || flag
      })
      if (flag) {
        return { ...state, records }
      }
      break
    }
  }
  return state
}

const initState = {
  records: {}, // {<questId>: {<subgoalName>: {count:, required:, description: }}}
  activeQuests: {}, // {<questId>: {detail: <quest>, time: <unix ms>}}
  questGoals: {}, // {<questId>: {type:, <subgoalName>: {init:, required:, description: }}}
  activeCapacity: 5,
  activeNum: 0,
}

export function reducer(state = initState, action, store) {
  const { type, postBody, body } = action
  switch (type) {
    //== Initialization. ==
    case '@@Response/kcsapi/api_get_member/require_info': {
      const admiralId = body.api_basic.api_member_id
      // Load static quest goal data
      let questGoals = {}
      try {
        questGoals = JSON.parse(JSON.stringify(CSON.parseCSONFile(questGoalsPath)))
      } catch (e) {
        console.warn('No quest goal data!')
      }
      // Load quest tracking of this account
      let records = {}
      try {
        records = JSON.parse(JSON.stringify(CSON.parseCSONFile(questTrackingPath(admiralId))))
        if (records && records.time) {
          records = outdateRecords(questGoals, records, records.time, Date.now())
        }
      } catch (e) {
        console.warn('No quest tracking data!')
      }
      delete records.time // Time is added ad-hoc upon saving
      return {
        ...state,
        records,
        questGoals,
        activeQuests: outdateActiveQuests(state.activeQuests, Date.now()),
      }
    }

    //== Daily update ==
    case QUESTS_REFRESH_DAY: {
      const { activeQuests, records, questGoals } = state
      const { now } = action
      const halfHour = 30 * 60 * 1000 // Random suitable margin
      return {
        ...state,
        records: outdateRecords(questGoals, records, now - halfHour, now + halfHour),
        activeQuests: outdateActiveQuests(activeQuests, now + halfHour),
      }
    }

    //== Update active quests ==
    case '@@Response/kcsapi/api_port/port': {
      const { api_parallel_quest_count: activeCapacity } = body
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
      const { api_exec_count: activeNum, api_list } = body
      let { activeQuests, records, questGoals } = state
      const now = Date.now()
      ;(api_list || []).forEach((quest) => {
        if (typeof quest !== 'object') return
        const { api_state, api_no } = quest
        let record
        // For all quests, create records and update progress
        if (!records[api_no] && questGoals[api_no]) {
          // Add new records
          record = newQuestRecord(api_no, questGoals)
        } else {
          record = records[api_no]
        }
        if (record) {
          record = updateRecordProgress(record, quest)
          if (record !== records[api_no]) {
            records = copyIfSame(records, state.records)
            records[api_no] = record
          }
        }
        // For active quests, update activeQuests
        if (api_state >= 2) {
          activeQuests = copyIfSame(activeQuests, state.activeQuests)
          activeQuests[api_no] = { detail: quest, time: now }
        } else {
          activeQuests = copyIfSame(activeQuests, state.activeQuests)
          delete activeQuests[api_no]
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
      const { api_quest_id } = postBody
      // records
      let { activeQuests, records, activeNum } = state
      activeNum--
      if (api_quest_id in records) {
        records = { ...records }
        delete records[api_quest_id]
      }
      // activeQuests
      if (api_quest_id in activeQuests) {
        activeQuests = { ...activeQuests }
        delete activeQuests[api_quest_id]
      }
      // activeCapacity
      let activeCapacity = (body.api_bounus || {}).api_count
      if (typeof activeCapacity === 'undefined') activeCapacity = state.activeCapacity
      return updateObject(state, {
        activeNum,
        activeQuests,
        records,
        activeCapacity,
      })
    }

    // Pause quest
    // case '@@Response/kcsapi/api_req_quest/stop': {
    //   // This api will be followed by a /kcsapi/api_get_member/questlist
    //   const {api_quest_id} = postBody
    //   let {activeNum, activeQuests} = state
    //   --activeNum
    //   if (api_quest_id in state.activeQuests) {
    //     activeQuests = {...activeQuests}
    //     delete activeQuests[api_quest_id]
    //   }
    //   return updateObject(state, {
    //     activeQuests,
    //     activeNum,
    //   })
    // }
  }
  // Update quest count
  return questTrackingReducer(state, action, store)
}

// Action
function dailyRefresh(now) {
  return {
    type: QUESTS_REFRESH_DAY,
    now,
  }
}

export function schedualDailyRefresh(dispatch) {
  const now = Date.now()
  // eslint-disable-next-line no-console
  console.log('Scheduling daily refresh at %d (now %d)', QUEST_REFRESH_ZERO, Date.now())
  Scheduler.schedule(
    (time) => {
      // TODO: Debug
      // eslint-disable-next-line no-console
      console.log('Daily refresh at %d scheduled at %d (now %d)', time, now, Date.now())
      dispatch(dailyRefresh(time))
    },
    {
      time: QUEST_REFRESH_ZERO, // TODO: this value has no effect here
      interval: ONE_DAY,
      allowImmediate: false,
    },
  )
}

function processQuestRecords(records, activeQuests) {
  records = Object.clone(records)
  forEach(records, (record, recordId) => {
    if (!record || typeof record !== 'object') return
    const [count, required] = arraySum(
      map(record, (subgoal) => {
        if (!subgoal || typeof subgoal !== 'object') return [0, 0]
        return [subgoal.count, subgoal.required]
      }),
    )
    record.count = count || 0
    record.required = required || 1
    if (recordId in activeQuests) record.active = true
  })
  records.time = Date.now()
  return records
}

const fileWriter = new FileWriter()

// Subscriber, used after the store is created
// Need to observe on state quests.records
export function saveQuestTracking(records) {
  const { activeQuests } = window.getStore('info.quests')
  const admiralId = window.getStore('info.basic.api_member_id')
  fileWriter.write(
    questTrackingPath(admiralId),
    CSON.stringify(processQuestRecords(records, activeQuests)),
  )
}
