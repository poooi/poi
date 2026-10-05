import type { QuestGoal, QuestGoalSubgoal, QuestGoalTable } from './types'

/**
 * A subgoal's `description` is the i18n key (`data` namespace) the task panel shows for
 * it. Most can be read off the subgoal itself — `battle_boss_win_rank_s` on `maparea:
 * [13]` is "1-3 S" — so the goal files leave them out and they are filled in here, by
 * the app when it loads the table and by `fcd/build.js` for the payload (older builds
 * and external readers expect every subgoal to carry one).
 *
 * A description written in the goal file always wins. It is *required* where the data
 * alone does not say it well enough, and `fcd/build.js` fails without one:
 *
 * - a `mapcell` — a cell number means nothing to a player; the file names the gauge
 *   (7-3-2) or the node (7-4-O) in words;
 * - a `mission_success` naming its expeditions, or a `destory_item` naming equipment —
 *   those names need master data, which this module deliberately does without.
 *
 * Every label below is an existing translation key in `i18n/data/*.json`, so filling
 * a description never changes what a translated panel shows.
 *
 * Keep this module free of imports other than types: `fcd/build.js` loads it outside
 * the app.
 */

// Ranked boss events on a single map read as "<map> <rank>".
const RANKED: Record<string, string> = {
  battle_boss_win_rank_s: 'S',
  battle_boss_win_rank_a: 'A',
  battle_boss_win: '勝利',
  battle_boss: 'ボス',
}

const LABELS: Record<string, string> = {
  sally: '出擊',
  battle: '作戰',
  battle_win: '勝利',
  battle_rank_s: 'S勝利',
  battle_boss: 'BOSS戰',
  battle_boss_win: 'BOSS戰勝利',
  practice: '演習',
  practice_win: '演習勝利',
  practice_win_a: '演習勝利 A',
  practice_win_s: '演習勝利 S',
  mission_success: '遠征',
  create_item: '開発',
  create_ship: '建造',
  destroy_ship: '解体',
  destory_item: '廃棄',
  remodel_item: '改修',
  remodel_ship: '近代化改修',
  repair: '入渠',
  supply: '補給',
}

// `sinking` by the enemy ship types it counts
const SUNK: Record<string, string> = {
  '7,11': '敵空母',
  '13': '敵潜水艦',
  '15': '敵補給艦',
}

const mapLabel = (maparea: number): string => `${Math.floor(maparea / 10)}-${maparea % 10}`

/**
 * The description generated for a subgoal from its key and filters, ignoring any
 * `description` it carries; `undefined` where one has to be written out.
 */
export function generateDescription(key: string, subgoal: QuestGoalSubgoal): string | undefined {
  if (subgoal.mapcell) return
  const event = key.split('@')[0]
  if (event in RANKED && subgoal.maparea?.length === 1) {
    return `${mapLabel(subgoal.maparea[0])} ${RANKED[event]}`
  }
  if (subgoal.maparea) return
  if (event === 'sinking') return SUNK[(subgoal.shipType ?? []).join(',')]
  if (event === 'mission_success' && subgoal.mission) return
  if (event === 'destory_item' && (subgoal.slotitemId || subgoal.slotitemType2)) return
  return LABELS[event]
}

/** The description a subgoal shows: its own if the goal file gives one, else generated. */
export const describeSubgoal = (key: string, subgoal: QuestGoalSubgoal): string | undefined =>
  subgoal.description ?? generateDescription(key, subgoal)

const isSubgoal = (value: unknown): value is QuestGoalSubgoal =>
  typeof value === 'object' && value !== null

/**
 * `table` with every subgoal's description filled in. Returns a new table and leaves
 * the input alone; a subgoal that gets no description is kept as it is.
 */
export function describeQuestGoals(table: QuestGoalTable): QuestGoalTable {
  const result: QuestGoalTable = {}
  for (const [id, goal] of Object.entries(table)) {
    if (!goal || typeof goal !== 'object') {
      result[id] = goal
      continue
    }
    const described: QuestGoal = { ...goal }
    for (const [key, value] of Object.entries(goal)) {
      if (!isSubgoal(value) || value.description !== undefined) continue
      const description = generateDescription(key, value)
      if (description !== undefined) {
        Object.assign(described, { [key]: { description, ...value } })
      }
    }
    result[id] = described
  }
  return result
}
