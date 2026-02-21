import i18next from 'views/env-parts/i18next'

interface TypesMap {
  [key: string]: string
}

const types: TypesMap = {
  api_taik: 'HP',
  api_souk: 'Armor',
  api_houg: 'Firepower',
  api_raig: 'Torpedo',
  api_soku: 'Speed',
  api_baku: 'Bombing',
  api_tyku: 'AA',
  api_tais: 'ASW',
  api_houm: 'Accuracy',
  // "api_raim": "Torpedo Accuracy",
  api_houk: 'Evasion',
  // "api_raik": "Torpedo Evasion",
  // "api_bakk": "Bombing Evasion",
  api_saku: 'LOS',
  // "api_sakb": "Anti-LOS",
  api_luck: 'Luck',
  api_leng: 'Range',
}

const landbaseFighterTypes: TypesMap = {
  api_houm: 'Anti-Bomber',
  api_houk: 'Interception',
}

const range = ['Short', 'Medium', 'Long', 'Very Long']

interface SlotItem {
  api_type: [number, number, number, number]
  [key: string]: unknown
}

export function getItemData(slotitem: SlotItem): string[] {
  const data: string[] = []
  for (const type in types) {
    const value = slotitem[type] as number | undefined
    if (value && value != 0) {
      if (type == 'api_leng') {
        data.push(
          `${i18next.t('data:' + types[type])} ${i18next.t('data:' + range[value - 1])}`,
        )
      } else if (
        [48].includes(slotitem.api_type[2]) &&
        ['api_houk', 'api_houm'].includes(type) &&
        value > 0
      ) {
        data.push(`${i18next.t('data:' + landbaseFighterTypes[type])} +${value}`)
      } else if (value > 0) {
        data.push(`${i18next.t('data:' + types[type])} +${value}`)
      } else {
        data.push(`${i18next.t('data:' + types[type])} ${value}`)
      }
    }
  }
  return data
}
