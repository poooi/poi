{_} = window

__ = window.i18n.others.__.bind(i18n.others)
__n = window.i18n.others.__n.bind(i18n.others)

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

# Stores information in onRequest, used in onResponse
requestRecord = null

# Multiplied by a factor of 5 to do operations in integers
luckProviders = (id) ->
  switch id
    when 163 then 6     # Maruyu
    when 402 then 8     # Maruyu Kai
    else 0

calcMaxDelta = (lst) ->
  baseSum = sum lst
  # According to the formula provided by wiki
  baseSum + Math.floor((baseSum+1)/5)

# Given sourceShips, the maximum statuses addable regardless of status cap
calcMaxDeltas = (sourceShips) ->
  maxFourDeltas = (calcMaxDelta l for l in _.unzip($ships[id].api_powup for id in sourceShips))
  maxLuck = Math.ceil(sum(luckProviders id for id in sourceShips) / 5 - 0.0001)
  maxDeltas = maxFourDeltas.concat [maxLuck]
  maxDeltas

apiStatuses = ['api_houg', 'api_raig', 'api_tyku', 'api_souk', 'api_luck']

calcRemainingStatuses = (ship) ->
  (for i in [0..4]
    ship[apiStatuses[i]][1] - (ship[apiStatuses[i]][0] + ship.api_kyouka[i]))

calcDisplayText = (targetShipBefore, sourceShips) ->
  # Clone it because it may have been modified on response
  kyoukaBefore = targetShipBefore.api_kyouka.slice()
  # Run unnecessary calculation in a promise to minimize the blocking of request
  new Promise (resolve) ->
    maxDeltas = calcMaxDeltas sourceShips
    resolve (targetShipAfter) ->
      kyoukaAfter = targetShipAfter.api_kyouka
      remainingAfter = calcRemainingStatuses targetShipAfter
      prerender = React.createClass
        render: ->
          <span>
          {__('Modernization succeeded! ')}
          {
            for i in [0..4]
              delta = kyoukaAfter[i] - kyoukaBefore[i]
              maxDelta = maxDeltas[i]
              remaining = remainingAfter[i]
              # Explaination for if condition:
              #   1st term: Something could have been added, but maybe delta == 0
              #   2nd term: Something has been added
              if (remaining > 0 && maxDelta != 0) || delta != 0
                upIcon = if remaining <= 0 || delta == maxDelta then 'angle-double-up' else 'angle-up'
                <span key={i}>
                  &nbsp;&nbsp;{nameStatuses[i]}&nbsp;
                  <FontAwesome key={0} name={upIcon} />
                  &nbsp;{delta}/
                  <span key={1} style={fontSize:'80%', verticalAlign:'baseline'}>
                    {if remaining <= 0 then 'MAX' else "+#{remaining}"}
                  </span>
                  &nbsp;&nbsp;
                </span>
          }
          </span>
      React.createElement prerender, null

onRequest = (e) ->
  if e.detail.path == '/kcsapi/api_req_kaisou/powerup'
    {api_id, api_id_items} = e.detail.body
    # Read the status before modernization
    sourceShips = (_ships[id_item].api_ship_id for id_item in api_id_items.split ',')
    requestRecord = calcDisplayText _ships[api_id], sourceShips

onResponse = (e) ->
  if e.detail.path == '/kcsapi/api_req_kaisou/powerup'
    # Read the status after modernization
    if e.detail.body.api_powerup_flag
      target = e.detail.body.api_ship
      requestRecord?.then (calcText) ->
        setTimeout window.success, 100, calcText _ships[target.api_id]
    else
      setTimeout window.warn, 100, __ 'Modernization failed.'

if config.get('feature.modernization-delta.enable', true)
  window.addEventListener 'game.request', onRequest
  window.addEventListener 'game.response', onResponse
