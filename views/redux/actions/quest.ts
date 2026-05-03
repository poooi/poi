import { createAction } from '@reduxjs/toolkit'

export const createInfoResourcesApplyDeltaAction = createAction<{ delta: number[] }>(
  '@@info.resources@ApplyDelta',
)

export type InfoResourcesApplyDeltaAction = ReturnType<typeof createInfoResourcesApplyDeltaAction>

export const createInfoEquipsRemoveByIdsAction = createAction<{ ids: Array<string | number> }>(
  '@@info.equips@RemoveByIds',
)

export type InfoEquipsRemoveByIdsAction = ReturnType<typeof createInfoEquipsRemoveByIdsAction>

export const createInfoShipsRepairCompletedAction = createAction<{ api_ship_id: number }>(
  '@@info.ships@RepairCompleted',
)

export type InfoShipsRepairCompletedAction = ReturnType<typeof createInfoShipsRepairCompletedAction>

export type QuestEvent =
  | 'practice'
  | 'practice_win'
  | 'practice_win_a'
  | 'practice_win_s'
  | 'mission_success'
  | 'repair'
  | 'supply'
  | 'create_item'
  | 'create_ship'
  | 'destroy_ship'
  | 'remodel_item'
  | 'remodel_ship'
  | 'destory_item'
  | 'sally'
  | 'reach_mapcell'
  | 'battle'
  | 'battle_win'
  | 'battle_rank_s'
  | 'battle_boss'
  | 'battle_boss_win'
  | 'battle_boss_win_rank_a'
  | 'battle_boss_win_rank_s'
  | 'sinking'

export interface QuestOptions {
  shipname?: string[]
  shiptype?: number[]
  shipclass?: number[]
  mission?: string
  maparea?: number
  mapcell?: number
  slotitemType2?: number
  times?: number
  shipType?: number
}

export const createInfoQuestsDailyRefreshAction = createAction<{ now: number }>(
  '@@info.quests@DailyRefresh',
)

export const createInfoQuestsApplyProgressAction = createAction<{
  event: QuestEvent
  options: QuestOptions | null
  delta: number
}>('@@info.quests@ApplyProgress')

export type InfoQuestsDailyRefreshAction = ReturnType<typeof createInfoQuestsDailyRefreshAction>
export type InfoQuestsApplyProgressAction = ReturnType<typeof createInfoQuestsApplyProgressAction>
