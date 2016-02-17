__ = window.i18n.data.__.bind(i18n.data)
__n = window.i18n.data.__n.bind(i18n.data)

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
  "api_raim": "Torpedo Accuracy"
  "api_houk": "Evasion"
  "api_raik": "Torpedo Evasion"
  "api_bakk": "Bombing Evasion"
  "api_saku": "LOS"
  "api_sakb": "Anti-LOS"
  "api_luck": "Luck"
  "api_leng": "Range"

module.exports =
  getItemData: (slotitem) ->
    data = []
    for type of types
      if slotitem[type] > 0
        data.push "#{__ types[type]}: #{slotitem[type]}"
    return data
