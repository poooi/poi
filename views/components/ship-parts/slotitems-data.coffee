if window.i18n?.data?
  __ = window.i18n.data.__.bind(window.i18n.data)
else
  path = require 'path-extra'
  i18n = new (require 'i18n-2')
    locales: ['en-US', 'ja-JP', 'zh-CN', 'zh-TW']
    defaultLocale: 'zh-CN'
    directory: path.join ROOT, 'i18n', 'data'
    updateFiles: false
    indent: "\t"
    extension: '.json'
    devMode: false
  i18n.setLocale(window.language)
  __ = i18n.__.bind(i18n)

types =
  "api_taik": "HP"
  "api_souk": "Armor"
  "api_houg": "Firepower"
  "api_raig": "Torpedo"
  "api_soku": "Speed"
  "api_baku": "Bombing"
  "api_tyku": "AA"
  "api_tais": "ASW"
  "api_houm": "Accuracy"
  #"api_raim": "Torpedo Accuracy"
  "api_houk": "Evasion"
  #"api_raik": "Torpedo Evasion"
  #"api_bakk": "Bombing Evasion"
  "api_saku": "LOS"
  #"api_sakb": "Anti-LOS"
  "api_luck": "Luck"
  "api_leng": "Range"
range = ['Short', 'Medium', 'Long', 'Very Long']

module.exports =
  getItemData: (slotitem) ->
    data = []
    for type of types
      if slotitem[type]? && slotitem[type] != 0
        if type != "api_leng"
          if slotitem[type] > 0
            data.push "#{__ types[type]} +#{slotitem[type]}"
          else
            data.push "#{__ types[type]} #{slotitem[type]}"
        else
          data.push "#{__ types[type]} #{__ range[slotitem[type] - 1]}"
    return data
