{_} = window

__ = window.i18n.others.__.bind(i18n.others)
__n = window.i18n.others.__n.bind(i18n.others)

beforeStatuses = null
afterStatuses = null
maxDeltas = null
nameStatuses = [
  __('Firepower'),
  __('Torpedo'),
  __('AntiAir'),
  __('Armor'),
  __('Luck')
]

sum = (l) ->
  s = 0
  for i in l
    s += i
  s

# Multiplied by a factor of 5 to do operations in integers
luckProviders = (id) ->
  switch id
    when 163 then 6     # Maruyu
    when 402 then 8     # Maruyu Kai
    else 0

getStatus = (ship, i) ->
  # i = 0 for current status, and i = 1 for max status
  if ship
    statuses = (s[i] for s in[
      ship.api_karyoku,
      ship.api_raisou,
      ship.api_taiku,
      ship.api_soukou,
      ship.api_lucky
    ])
getCurrentStatus = (ship) -> getStatus(ship, 0)
getMaxStatus = (ship) -> getStatus(ship, 1)

maxDelta = (lst) ->
  baseSum = sum lst
  # According to the formula provided by wiki
  baseSum + Math.floor((baseSum+1)/5)

calcMaxDeltas = (sourceShips) ->
  maxFourDeltas = (maxDelta l for l in _.unzip($ships[id].api_powup for id in sourceShips))
  maxLuck = Math.ceil(sum(luckProviders id for id in sourceShips) / 5 - 0.0001)
  maxDeltas = maxFourDeltas.concat [maxLuck]
  maxDeltas

textStatus = (nameStatus, beforeStatus, afterStatus, maxStatus, maxDelta) ->
  delta = afterStatus - beforeStatus
  if maxDelta != 0
    if afterStatus == maxStatus || delta == maxDelta
      "#{nameStatus} ++#{delta}"
    else
      "#{nameStatus} +#{delta}"

onRequest = (e) ->
  if e.detail.path == '/kcsapi/api_req_kaisou/powerup'
    {api_id, api_id_items} = e.detail.body
    # Read the status before modernization
    target = _ships[api_id]
    beforeStatuses = getCurrentStatus target
    sourceShips = (_ships[id_item].api_ship_id for id_item in api_id_items.split ',')
    maxDeltas = calcMaxDeltas sourceShips

onResponse = (e) ->
  if e.detail.path == '/kcsapi/api_req_kaisou/powerup'
    # Read the status after modernization
    if e.detail.body.api_powerup_flag
      target = e.detail.body.api_ship
      afterStatuses = getCurrentStatus target
      maxStatuses = getMaxStatus target
      if beforeStatuses && afterStatuses
        textStatuses = (textStatus(t, s1, s2, ms, md) for [t, s1, s2, ms, md] in \
              _.zip(nameStatuses, beforeStatuses, afterStatuses, maxStatuses, maxDeltas) when md != 0 && s1 != s2)
        setTimeout window.success, 100, __('Modernization succeeded! ') + textStatuses.join('　')
    else
      setTimeout window.warn, 100, __ 'Modernization failed.'

if config.get('feature.modernization-delta.enable', true)
  window.addEventListener 'game.request', onRequest
  window.addEventListener 'game.response', onResponse
