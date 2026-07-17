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
type EscortShipConstraint = [string[], number, boolean?]

// [shipTypeIds[], minCount, exclusive?]
type EscortShipTypeConstraint = [number[], number, boolean?]

// [shipClassIds[], minCount, exclusive?]
type EscortShipClassConstraint = [number[], number, boolean?]

export type GoalKey = QuestEvent | `${QuestEvent}@${string}`

export interface QuestGoalSubgoal {
  description?: string
  required: number
  init?: number
  // Map constraints
  maparea?: number[]
  mapcell?: number[]
  // Flagship constraints
  flagship?: string[]
  flagshiptype?: number[]
  flagshipclass?: number[]
  // Escort ship constraints
  secondship?: string[]
  secondshipclass?: number[]
  escortship?: EscortShipConstraint[]
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
