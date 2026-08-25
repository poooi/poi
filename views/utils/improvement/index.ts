import type { APIMstSlotitem } from 'kcsapi/api_start2/getData/response'

import type {
  ImprovementContext,
  ImprovementRule,
  ImprovementStat,
  ImprovementTable,
} from './table'

import { DEFAULT_IMPROVEMENT_TABLE } from './table'

export type {
  ImprovementContext,
  ImprovementGuardStat,
  ImprovementRule,
  ImprovementStat,
  ImprovementTable,
} from './table'
export { DEFAULT_IMPROVEMENT_TABLE, FIGHTER_BOMBER_IDS } from './table'

/**
 * The (stat, context) pairs the game floors to one decimal rather than carrying
 * the full value into its own formula — 遠征 is "小数点第1位まで計算され、第2位以下
 * 切り捨て", and 触接 goes with them. Accuracy and evasion are not among them.
 */
const ROUNDED: `${ImprovementStat}/${ImprovementContext}`[] = [
  'power/exped',
  'asw/exped',
  'los/exped',
  'los/contact',
  'aa/exped',
]

/** Master data a rule can match on — anything less is not worth a bonus. */
type ImprovableEquip = Pick<APIMstSlotitem, 'api_id' | 'api_type'> &
  Partial<Pick<APIMstSlotitem, 'api_houg' | 'api_houm' | 'api_tais'>>

const matches = ($equip: ImprovableEquip, rule: ImprovementRule): boolean => {
  if (rule.ids && !rule.ids.includes($equip.api_id)) return false
  if (rule.types && !rule.types.includes($equip.api_type[2])) return false
  if (rule.icon != null && $equip.api_type[3] !== rule.icon) return false
  if (rule.above && ($equip[rule.above.stat] ?? 0) <= rule.above.value) return false
  return true
}

/**
 * The ★ bonus one piece of equipment contributes to `stat` in `context`.
 *
 * Rules are tried in order and the first match wins, so a narrow rule (an id
 * list, a stat threshold) precedes the broad category rule it carves out of.
 */
export const getImprovementBonus = (
  $equip: ImprovableEquip,
  level: number,
  stat: ImprovementStat,
  context: ImprovementContext = 'fire',
  table: ImprovementTable = DEFAULT_IMPROVEMENT_TABLE,
): number => {
  if (!(level > 0)) return 0
  const rule = table[stat]?.[context]?.find((candidate) => matches($equip, candidate))
  if (!rule) return 0
  const bonus = rule.factor * (rule.scale === 'sqrt' ? Math.sqrt(level) : level)
  if (!ROUNDED.includes(`${stat}/${context}`)) return bonus
  // toFixed rather than a *10 round trip: 0.3 * 7 lands on 2.0999999999999996
  return Math.floor(Number(bonus.toFixed(4)) * 10) / 10
}
