import type { APIList } from 'kcsapi/api_get_member/questlist/response'

import type { QuestOptions, QuestEvent } from '../../actions'

// Type declarations
// quest_goal.cson type declaration

// 1=daily, 2=weekly, 3=monthly, 4=quarterly, 8/9=special daily
// 101-112 = yearly by month (101=Jan, 102=Feb, ...)
export type QuestType =
  | 1
  | 2
  | 3
  | 4
  | 8
  | 9
  | 101
  | 102
  | 103
  | 104
  | 105
  | 106
  | 107
  | 108
  | 109
  | 110
  | 111
  | 112

// [shipNames[], minCount, exclusive?]
/** @deprecated see `QuestGoalSubgoal.escortship` */
type EscortShipConstraint = [string[], number, boolean?]

// [shipTypeIds[], minCount, exclusive?]
type EscortShipTypeConstraint = [number[], number, boolean?]

// [shipClassIds[], minCount, exclusive?]
type EscortShipClassConstraint = [number[], number, boolean?]

// [shipMasterIds[], minCount, exclusive?]
type EscortShipIdConstraint = [number[], number, boolean?]

export type GoalKey = QuestEvent | `${QuestEvent}@${string}`

export interface QuestGoalSubgoal {
  description?: string
  required: number
  init?: number
  // Map constraints
  maparea?: number[]
  mapcell?: number[]
  // Flagship constraints
  /** @deprecated substring-matched by name; use `flagshipId`. */
  flagship?: string[]
  flagshiptype?: number[]
  flagshipclass?: number[]
  /**
   * Master ship ids the flagship must be at or after in its remodel line — the id
   * names where the ship *starts* counting, and every later remodel counts too.
   */
  flagshipId?: number[]
  // Escort ship constraints
  /** @deprecated substring-matched by name; use `secondshipId`. */
  secondship?: string[]
  secondshipclass?: number[]
  secondshipId?: number[]
  /** @deprecated substring-matched by name, and its entries are OR-ed; use `escortshipId`. */
  escortship?: EscortShipConstraint[]
  /**
   * `escortship` by master id: at least one entry must hold, as with `escortship`.
   * For a quest that takes either of two escort groups — 903 asks for 由良改二 ×1
   * *or* 睦月型 ×2.
   */
  escortshipId?: EscortShipIdConstraint[]
  /**
   * The AND of `escortshipId`: every entry must hold, as with `escortshiptype`. For
   * a quest that asks for two groups together — 1051 wants 扶桑/時雨 ×1 *and*
   * 最上/満潮/朝雲/山雲 ×2.
   */
  escortshipIdAll?: EscortShipIdConstraint[]
  escortshiptype?: EscortShipTypeConstraint[]
  escortshipclass?: EscortShipClassConstraint[]
  banshiptype?: number[]
  fleetlimit?: number
  // Enemy ship filter
  shipType?: number[]
  // Expedition filter
  mission?: string[]
  // Equipment filter
  slotitemType2?: number[]
  slotitemId?: number[]
  materialShipType?: number[]
  materialShipMinCount?: number
  // Internal tracking hint (used to disambiguate overlapping quests)
  times?: number[]
}

export type RequestGoalKey = keyof QuestGoalSubgoal & keyof QuestOptions

export type QuestGoal = {
  type?: QuestType
  fuzzy?: boolean
  resetInterval?: number
} & Partial<Record<GoalKey, QuestGoalSubgoal>>

/** The whole goal table, keyed by quest id. */
export type QuestGoalTable = Record<string | number, QuestGoal>

// quest_tracking.cson type declaration
export interface SubgoalRecord {
  count: number
  required: number
  description?: string
}

export type QuestRecord = {
  id: number | string
  count?: number
  required?: number
  active?: boolean
  time?: number
} & Partial<Record<GoalKey, SubgoalRecord>>

export interface ActiveQuest {
  detail: APIList
  time: number
}

export interface QuestsState {
  records: Record<string | number, QuestRecord>
  activeQuests: Record<string | number, ActiveQuest>
  questGoals: Record<string | number, QuestGoal>
  activeCapacity: number
  activeNum: number
}
