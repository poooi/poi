import i18next from 'views/env-parts/i18next'

const types = {
  "api_taik": "HP",
  "api_souk": "Armor",
  "api_houg": "Firepower",
  "api_raig": "Torpedo",
  "api_soku": "Speed",
  "api_baku": "Bombing",
  "api_tyku": "AA",
  "api_tais": "ASW",
  "api_houm": "Accuracy",
  //"api_raim": "Torpedo Accuracy",
  "api_houk": "Evasion",
  //"api_raik": "Torpedo Evasion",
  //"api_bakk": "Bombing Evasion",
  "api_saku": "LOS",
  //"api_sakb": "Anti-LOS",
  "api_luck": "Luck",
  "api_leng": "Range",
}

const landbaseFighterTypes = {
  "api_houm": "Anti-Bomber",
  "api_houk": "Interception",
}

const range = ['Short', 'Medium', 'Long', 'Very Long']

export function getItemData(slotitem) {
  const data = []
  for (const type in types) {
    if (slotitem[type] && slotitem[type] != 0) {
      if (type == "api_leng") {
        data.push(`${i18next.t('data:' + types[type])} ${i18next.t('data:' + range[slotitem[type] - 1])}`)
      } else if ([48].includes(slotitem.api_type[2]) && ['api_houk', 'api_houm'].includes(type) && slotitem[type] > 0) {
        data.push(`${i18next.t('data:' + landbaseFighterTypes[type])} +${slotitem[type]}`)
      } else if (slotitem[type] > 0) {
        data.push(`${i18next.t('data:' + types[type])} +${slotitem[type]}`)
      } else {
        data.push(`${i18next.t('data:' + types[type])} ${slotitem[type]}`)
      }
    }
  }
  return data
}
