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
 * the full value into its own formula. Accuracy and evasion are not among them:
 * only the stats an expedition scores on are rounded, and 触接 with them.
 * https://twitter.com/myteaGuard/status/1375386223217238017
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
 * Rules are tried in order and the first match wins, so an fcd payload can
 * carve an exception out of a category by putting the narrower rule first.
 */
export const getImprovementBonus = (
  $equip: ImprovableEquip,
  level: number,
  stat: ImprovementStat,
  context: ImprovementContext = 'fire',
  table: ImprovementTable = getImprovementTable(),
): number => {
  if (!(level > 0)) return 0
  const rule = table[stat]?.[context]?.find((candidate) => matches($equip, candidate))
  if (!rule) return 0
  const bonus = rule.factor * (rule.scale === 'sqrt' ? Math.sqrt(level) : level)
  if (!ROUNDED.includes(`${stat}/${context}`)) return bonus
  // toFixed rather than a *10 round trip: 0.3 * 7 lands on 2.0999999999999996
  return Math.floor(Number(bonus.toFixed(4)) * 10) / 10
}

/**
 * The table in force. fcd replaces this at runtime — see the observer in
 * `views/redux/create-store` — so that callers with no store access
 * (`getTyku` and friends) still read corrected values.
 */
let currentTable: ImprovementTable = DEFAULT_IMPROVEMENT_TABLE

export const getImprovementTable = (): ImprovementTable => currentTable

export const setImprovementTable = (table: ImprovementTable | undefined): ImprovementTable => {
  currentTable = mergeImprovementTable(table)
  return currentTable
}

export const resetImprovementTable = (): void => {
  currentTable = DEFAULT_IMPROVEMENT_TABLE
}

/**
 * Applies an fcd payload over the built-in table, one (stat, context) list at a
 * time. A delivered list replaces its default outright — the rules are ordered
 * and keyless, so there is nothing to merge them on — but a stat or context the
 * payload omits keeps its default, because a payload cached before poi learned
 * about a context would otherwise blank it out.
 */
export const mergeImprovementTable = (table: ImprovementTable | undefined): ImprovementTable => {
  if (!table) return DEFAULT_IMPROVEMENT_TABLE
  const merged: ImprovementTable = { ...DEFAULT_IMPROVEMENT_TABLE }
  let stat: ImprovementStat
  for (stat in DEFAULT_IMPROVEMENT_TABLE) {
    const delivered = table[stat]
    if (!delivered) continue
    merged[stat] = { ...DEFAULT_IMPROVEMENT_TABLE[stat], ...delivered }
  }
  return merged
}
