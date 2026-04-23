import i18next from 'views/env-parts/i18next'

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

const range = ['Short', 'Medium', 'Long', 'Very Long'] as const

type SlotItem = { api_type: number[] } & { [K in SlotItemKey]?: number }

const isSlotItemKey = (k: string): k is SlotItemKey => k in types

export function getItemData(slotitem: SlotItem): string[] {
  const data: string[] = []
  for (const type of Object.keys(types)) {
    if (!isSlotItemKey(type)) continue
    const val = slotitem[type]
    if (val == null || val === 0) continue

    if (type === 'api_leng') {
      data.push(`${i18next.t('data:' + types[type])} ${i18next.t('data:' + range[val - 1])}`)
    } else if (
      slotitem.api_type[2] === 48 &&
      (type === 'api_houk' || type === 'api_houm') &&
      val > 0
    ) {
      data.push(`${i18next.t('data:' + landbaseFighterTypes[type])} +${val}`)
    } else if (val > 0) {
      data.push(`${i18next.t('data:' + types[type])} +${val}`)
    } else {
      data.push(`${i18next.t('data:' + types[type])} ${val}`)
    }
  }
  return data
}
