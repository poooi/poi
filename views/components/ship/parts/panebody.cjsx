{$, $$, _, React, ReactBootstrap, resolveTime, notify} = window
{Table, ProgressBar, OverlayTrigger, Tooltip, Grid, Col, Alert} = ReactBootstrap

Slotitems = require './slotitems'


getMaterialStyle = (percent) ->
  if percent <= 50
    'danger'
  else if percent <= 75
    'warning'
  else if percent < 100
    'info'
  else
    'success'

getCondStyle = (cond) ->
  if window.theme.indexOf('dark') != -1 or window.theme == 'slate' or window.theme == 'superhero'
    if cond > 49
      color: '#FFFF00'
    else if cond < 20
      color: '#DD514C'
    else if cond < 30
      color: '#F37B1D'
    else if cond < 40
      color: '#FFC880'
    else
      null
  else
    if cond > 49
      'text-shadow': '0 0 3px #FFFF00'
    else if cond < 20
      'text-shadow': '0 0 3px #DD514C'
    else if cond < 30
      'text-shadow': '0 0 3px #F37B1D'
    else if cond < 40
      'text-shadow': '0 0 3px #FFC880'
    else
      null

getFontStyle = (theme)  ->
  if window.theme.indexOf('dark') != -1 or window.theme == 'slate' or window.theme == 'superhero'
    color: '#FFF'
  else
    color: '#000'

getCondCountdown = (deck) ->
  {$ships, $slotitems, _ships} = window
  countdown = 0
  cond = 49
  for shipId in deck.api_ship
    continue if shipId == -1
    ship = _ships[shipId]
    if ship.api_cond < 49
      cond = Math.min(cond, ship.api_cond)
    countdown = Math.max(countdown, Math.ceil((49 - cond) / 3) * 180)
  ret = 
    countdown: countdown
    cond: cond

getHpStyle = (percent) ->
  if percent <= 25
    'danger'
  else if percent <= 50
    'warning'
  else if percent <= 75
    'info'
  else
    'success'

getDeckMessage = (deck) ->
  {$ships, $slotitems, _ships} = window
  totalLv = totalShip = totalTyku = totalSaku = shipSaku = itemSaku = teitokuSaku = 0
  for shipId in deck.api_ship
    continue if shipId == -1
    ship = _ships[shipId]
    shipInfo = $ships[ship.api_ship_id]
    totalLv += ship.api_lv
    totalShip += 1
    shipPureSaku = ship.api_sakuteki[0]
    for itemId, slotId in ship.api_slot
      continue if itemId == -1
      item = _slotitems[itemId]
      itemInfo = $slotitems[item.api_slotitem_id]
      # Airplane Tyku
      if itemInfo.api_type[3] in [6, 7, 8]
        totalTyku += Math.floor(Math.sqrt(ship.api_onslot[slotId]) * itemInfo.api_tyku)
      else if itemInfo.api_type[3] == 10 && itemInfo.api_type[2] == 11
        totalTyku += Math.floor(Math.sqrt(ship.api_onslot[slotId]) * itemInfo.api_tyku)
      # Saku
      # 索敵スコア = 艦上爆撃機 × (1.04) + 艦上攻撃機 × (1.37) + 艦上偵察機 × (1.66) + 水上偵察機 × (2.00)
      #            + 水上爆撃機 × (1.78) + 小型電探 × (1.00) + 大型電探 × (0.99) + 探照灯 × (0.91)
      #            + √(各艦毎の素索敵) × (1.69) + (司令部レベルを5の倍数に切り上げ) × (-0.61)
      shipPureSaku -= itemInfo.api_saku
      switch itemInfo.api_type[3]
        when 7
          itemSaku += itemInfo.api_saku * 1.04
        when 8
          itemSaku += itemInfo.api_saku * 1.37
        when 9
          itemSaku += itemInfo.api_saku * 1.66
        when 10
          if itemInfo.api_type[2] == 10
            itemSaku += itemInfo.api_saku * 2.00
          else if itemInfo.api_type[2] == 11
            itemSaku += itemInfo.api_saku * 1.78
        when 11
          if itemInfo.api_type[2] == 12
            itemSaku += itemInfo.api_saku * 1.00
          else if itemInfo.api_type[2] == 13
            itemSaku += itemInfo.api_saku * 0.99
        when 24
          itemSaku += itemInfo.api_saku * 0.91
    shipSaku += Math.sqrt(shipPureSaku) * 1.69
  teitokuSaku = 0.61 * Math.floor((window._teitokuLv + 4) / 5) * 5
  totalSaku = shipSaku + itemSaku - teitokuSaku
  avgLv = totalLv / totalShip
  [totalLv, parseFloat(avgLv.toFixed(0)), totalTyku, parseFloat(totalSaku.toFixed(0)), parseFloat(shipSaku.toFixed(2)), parseFloat(itemSaku.toFixed(2)), parseFloat(teitokuSaku.toFixed(2))]

TopAlert = React.createClass
  messages: ['没有舰队信息']
  countdown: 0
  timeDelta: 0
  cond: 0
  setAlert: ->
    decks = window._decks
    @messages = getDeckMessage decks[@props.deckIndex]
    tmp = getCondCountdown decks[@props.deckIndex]
    @countdown = tmp.countdown
    if tmp.countdown isnt @cond
      @timeDelta = 0
      @cond = tmp.countdown
    if @countdown > 0
      @interval = setInterval @updateCountdown, 1000 if !@interval?
    else
      @interval = clearInterval @interval if @interval?
  componentWillUpdate: ->
    @setAlert()
  updateCountdown: ->
    flag = true
    if @countdown - @timeDelta > 0
      flag = false
      @timeDelta += 1
      # Use DOM operation instead of React for performance
      $("#ShipView #deck-condition-countdown-#{@props.deckIndex}-#{@componentId}").innerHTML = resolveTime(@countdown - @timeDelta)
      if @countdown == @timeDelta and @props.deckState < 4
        notify "#{@props.names} 疲劳回复完成", {icon: join(ROOT, 'assets', 'img', 'operation', 'sortie.png')}
    @interval = clearInterval @interval if flag
  componentWillMount: ->
    @setAlert()
  componentDidMount: ->
    @componentId = Math.ceil(Date.now() * Math.random())
  componentWillUnmount: ->
    @interval = clearInterval @interval if @interval?
  render: ->
    <Alert style={getFontStyle window.theme}>
      <Grid>
        <Col xs={2}>
          总 Lv.{@messages[0]}
        </Col>
        <Col xs={2}>
          均 Lv.{@messages[1]}
        </Col>
        <Col xs={2}>
          制空：{@messages[2]}
        </Col>
        <Col xs={2}>
          <OverlayTrigger placement='bottom' overlay={<Tooltip>[艦娘]{@messages[4]} + [装備]{@messages[5]} - [司令部]{@messages[6]}</Tooltip>}>
            <span>索敌：{@messages[3]}</span>
          </OverlayTrigger>
        </Col>
        <Col xs={4}>
          回复：<span id={"deck-condition-countdown-#{@props.deckIndex}-#{@componentId}"}>{resolveTime @countdown}</span>
        </Col>
      </Grid>
    </Alert>

PaneBody = React.createClass
  # getInitialState: ->
  #   
  shouldComponentUpdate: (nextProps, nextState)->
    if nextProps.activeDeck isnt @props.activeDeck
      false
    else
      true
  render: ->
    <div>
      <TopAlert 
        messages={@props.messages}
        deckIndex={@props.deckIndex}
        deckName={@props.deckName}
        deckState={@props.deckState} />
      <Table>
        <tbody>
        {
          {$ships, $shipTypes, _ships} = window
          for shipId, j in @props.deck.api_ship
            continue if shipId == -1
            ship = _ships[shipId]
            shipInfo = $ships[ship.api_ship_id]
            shipType = $shipTypes[shipInfo.api_stype].api_name
            [
              <tr key={j * 2}>
                <td width="20%">{shipInfo.api_name}</td>
                <td width="22%">Lv. {ship.api_lv}</td>
                <td width="25%" className="hp-progress">
                  <ProgressBar bsStyle={getHpStyle ship.api_nowhp / ship.api_maxhp * 100}
                               now={ship.api_nowhp / ship.api_maxhp * 100}
                               label={"#{ship.api_nowhp} / #{ship.api_maxhp}"} />
                </td>
                <td width="33%">
                  <Slotitems data={ship.api_slot} onslot={ship.api_onslot} maxeq={ship.api_maxeq} />
                </td>
              </tr>
              <tr key={j * 2 + 1}>
                <td>{shipType}</td>
                <td>Next. {ship.api_exp[1]}</td>
                <td className="material-progress">
                  <Grid>
                    <Col xs={6} style={paddingRight: 1}>
                      <ProgressBar bsStyle={getMaterialStyle ship.api_fuel / shipInfo.api_fuel_max * 100}
                                     now={ship.api_fuel / shipInfo.api_fuel_max * 100} />
                    </Col>
                    <Col xs={6} style={paddingLeft: 1}>
                      <ProgressBar bsStyle={getMaterialStyle ship.api_bull / shipInfo.api_bull_max * 100}
                                     now={ship.api_bull / shipInfo.api_bull_max * 100} />
                    </Col>
                  </Grid>
                </td>
                <td style={getCondStyle ship.api_cond}>Cond. {ship.api_cond}</td>
              </tr>
            ]
        }
        </tbody>
      </Table>
    </div>

module.exports = PaneBody
