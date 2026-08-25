import type { ImprovementContext, ImprovementStat } from 'views/utils/improvement'

import i18next from 'views/env-parts/i18next'
import { getImprovementBonus } from 'views/utils/improvement'

const types = {
  api_taik: 'HP',
  api_souk: 'Armor',
  api_houg: 'Firepower',
  api_raig: 'Torpedo',
  api_soku: 'Speed',
  api_baku: 'Bombing',
  api_tyku: 'AA',
  api_tais: 'ASW',
  api_houm: 'Accuracy',
  api_houk: 'Evasion',
  api_saku: 'LOS',
  api_luck: 'Luck',
  api_leng: 'Range',
} as const

type SlotItemKey = keyof typeof types

const landbaseFighterTypes: Partial<Record<SlotItemKey, string>> = {
  api_houm: 'Anti-Bomber',
  api_houk: 'Interception',
}

/**
 * Which ★ bonus each stat line carries. These are all *stat* bonuses, so what
 * the tooltip prints is in the same unit as the number beside it — 火力 takes
 * the day shelling one, which is where a stat and its attack power coincide.
 * Stats absent here (HP, 速力, 運, 射程) never improve.
 */
const improvementOf: Partial<Record<SlotItemKey, [ImprovementStat, ImprovementContext]>> = {
  api_houg: ['power', 'fire'],
  api_raig: ['torpedo', 'fire'],
  api_baku: ['bomber', 'fire'],
  api_tais: ['asw', 'fire'],
  api_souk: ['armor', 'fire'],
  api_tyku: ['aa', 'fire'],
  api_houm: ['accuracy', 'fire'],
  api_houk: ['evasion', 'fire'],
  api_saku: ['los', 'fire'],
}

const range = ['Short', 'Medium', 'Long', 'Very Long'] as const

type SlotItem = { api_id: number; api_type: number[] } & { [K in SlotItemKey]?: number }

const isSlotItemKey = (k: string): k is SlotItemKey => k in types

/** One decimal at most, and no trailing `.0` on the many whole-number bonuses. */
const formatBonus = (bonus: number): string => String(Math.round(bonus * 10) / 10)

export function getItemData(slotitem: SlotItem, level = 0): string[] {
  const data: string[] = []
  for (const type of Object.keys(types)) {
    if (!isSlotItemKey(type)) continue
    const val = slotitem[type]
    if (val == null || val === 0) continue

    const [stat, context] = improvementOf[type] ?? []
    const bonus = stat && context ? getImprovementBonus(slotitem, level, stat, context) : 0
    // Shown beside the master value rather than folded into it: the game keeps
    // printing the ★0 stat too, and the gap is the point.
    const improvement = bonus > 0 ? ` (+${formatBonus(bonus)})` : ''

    if (type === 'api_leng') {
      data.push(`${i18next.t('data:' + types[type])} ${i18next.t('data:' + range[val - 1])}`)
    } else if (
      slotitem.api_type[2] === 48 &&
      (type === 'api_houk' || type === 'api_houm') &&
      val > 0
    ) {
      data.push(`${i18next.t('data:' + landbaseFighterTypes[type])} +${val}${improvement}`)
    } else if (val > 0) {
      data.push(`${i18next.t('data:' + types[type])} +${val}${improvement}`)
    } else {
      data.push(`${i18next.t('data:' + types[type])} ${val}${improvement}`)
    }
  }
  return data
}
