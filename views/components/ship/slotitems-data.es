import {join} from 'path-extra'
import i18n2 from 'i18n-2'

const {ROOT} = window

let __

if((window.i18n||{}).data) {
  __ = window.i18n.data.__.bind(window.i18n.data)
} else {
  const i18n = new i18n2({
    locales: ['ko-KR', 'en-US', 'ja-JP', 'zh-CN', 'zh-TW'],
    defaultLocale: 'zh-CN',
    directory: join(ROOT, 'i18n', 'data'),
    updateFiles: false,
    indent: "\t",
    extension: '.json',
    devMode: false,
  })
  i18n.setLocale(window.language)
  __ = i18n.__.bind(i18n)
}

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
        data.push(`${__(types[type])} ${__(range[slotitem[type] - 1])}`)
      } else if ([38, 44].includes(slotitem.api_type[3]) && [48].includes(slotitem.api_type[2]) && ['api_houk', 'api_houm'].includes(type) && slotitem[type] > 0) {
        data.push(`${__(landbaseFighterTypes[type])} +${slotitem[type]}`)
      } else if (slotitem[type] > 0) {
        data.push(`${__(types[type])} +${slotitem[type]}`)
      } else {
        data.push(`${__(types[type])} ${slotitem[type]}`)
      }
    }
  }
  return data
}
