###
battle.result =
  rank: String
  boss: Boolean
  map: Integer(2-3 => 23)
  enemyHp: Array of Integer
  deckHp: Array of Integer
  enemyShipId: Array of Integer
  deckShipId: Array of Integer
###
# Calculate result from battle info
deckId = -1
combined = false
map = -1
bossCell = -1
currentCell = -1
battled = false
enemyShipId = []
_sortieHp = []
_combinedHp = []
_enemyHp = []
# Formation: 0 - 単縦陣, 1 - 複縦陣, 2 - 輪形陣, 3 - 梯形陣, 4 - 単横陣,
# 5 - 第一警戒航行序列, 6 - 第二警戒航行序列, 7 - 第三警戒航行序列, 8 - 第四警戒航行序列
enemyFormation = 0
colorNo = -1

koukuAttack = (sortieHp, enemyHp, kouku) ->
  if kouku.api_edam?
    for damage, i in kouku.api_edam
      damage = Math.floor(damage)
      if damage > 0
        enemyHp[i - 1] -= damage
  if kouku.api_fdam?
    for damage, i in kouku.api_fdam
      damage = Math.floor(damage)
      if damage > 0
        sortieHp[i - 1] -= damage

supportAttack = (sortieHp, enemyHp, support) ->
  for damage, i in support
    damage = Math.floor(damage)
    continue if damage <= 0 || i > 6
    enemyHp[i - 1] -= damage

raigekiAttack = (sortieHp, enemyHp, raigeki) ->
  if raigeki.api_edam?
    for damage, i in raigeki.api_edam
      damage = Math.floor(damage)
      if damage > 0
        enemyHp[i - 1] -= damage
  if raigeki.api_fdam?
    for damage, i in raigeki.api_fdam
      damage = Math.floor(damage)
      if damage > 0
        sortieHp[i - 1] -= damage

hougekiAttack = (sortieHp, enemyHp, hougeki) ->
  for damageFrom, i in hougeki.api_at_list
    continue if damageFrom == -1
    for damage, j in hougeki.api_damage[i]
      damage = Math.floor(damage)
      damageTo = hougeki.api_df_list[i][j]
      continue if damage <= 0
      if damageTo < 7
        sortieHp[damageTo - 1] -= damage
      else
        enemyHp[damageTo - 1 - 6] -= damage

analogBattle = (sortieHp, enemyHp, combinedHp, isCombined, isWater, body) ->
  # First air battle
  if body.api_kouku?
    if body.api_kouku.api_stage3?
      koukuAttack sortieHp, enemyHp, body.api_kouku.api_stage3
    if body.api_kouku.api_stage3_combined?
      koukuAttack combinedHp, enemyHp, body.api_kouku.api_stage3_combined
  # Second air battle
  if body.api_kouku2?
    if body.api_kouku2.api_stage3?
      koukuAttack sortieHp, enemyHp, body.api_kouku2.api_stage3
    if body.api_kouku2.api_stage3_combined?
      koukuAttack combinedHp, enemyHp, body.api_kouku2.api_stage3_combined
  # Support battle
  if body.api_support_info?
    if body.api_support_info.api_support_airatack?
      supportAttack sortieHp, enemyHp, body.api_support_info.api_support_airatack.api_stage3.api_edam
    else if body.api_support_info.api_support_hourai?
      supportAttack sortieHp, enemyHp, body.api_support_info.api_support_hourai.api_damage
    else
      supportAttack sortieHp, enemyHp, body.api_support_info.api_damage
  # Opening battle
  if body.api_opening_atack?
    if isCombined
      raigekiAttack combinedHp, enemyHp, body.api_opening_atack
    else
      raigekiAttack sortieHp, enemyHp, body.api_opening_atack
  # Night battle
  if body.api_hougeki?
    if isCombined
      hougekiAttack combinedHp, enemyHp, body.api_hougeki
    else
      hougekiAttack sortieHp, enemyHp, body.api_hougeki
  # First hougeki battle
  if body.api_hougeki1?
    if isCombined && !isWater
      hougekiAttack combinedHp, enemyHp, body.api_hougeki1
    else
      hougekiAttack sortieHp, enemyHp, body.api_hougeki1
  # Second hougeki battle
  if body.api_hougeki2?
    hougekiAttack sortieHp, enemyHp, body.api_hougeki2
  # Combined hougeki battle
  if body.api_hougeki3?
    if isCombined && isWater
      hougekiAttack combinedHp, enemyHp, body.api_hougeki3
    else
      hougekiAttack sortieHp, enemyHp, body.api_hougeki3
  # Raigeki battle
  if body.api_raigeki?
    if isCombined
      raigekiAttack combinedHp, enemyHp, body.api_raigeki
    else
      raigekiAttack sortieHp, enemyHp, body.api_raigeki

window.addEventListener 'game.response', (e) ->
  {method, path, body, postBody} = e.detail
  switch path
    when '/kcsapi/api_req_map/start'
      # Refresh current map info
      combined = false
      battled = false
      map = body.api_maparea_id * 10 + body.api_mapinfo_no
      bossCell = body.api_bosscell_no
      currentCell = body.api_no
      deckId = parseInt(postBody.api_deck_id) - 1
      nowHp = []
      colorNo = body.api_color_no
      enemyFormation = 0
    when '/kcsapi/api_req_map/next'
      currentCell = body.api_no
      battled = false
      colorNo = body.api_color_no
      enemyFormation = 0
    when '/kcsapi/api_port/port'
      # Initialize all info
      deckId = -1
      combined = false
      map = -1
      bossCell = -1
      currentCell = -1
      battled = false
      nowHp = []
      enemyShipId = []
      colorNo = -1
      enemyFormation = 0
    # Normal battle
    when '/kcsapi/api_req_sortie/battle', '/kcsapi/api_req_battle_midnight/battle', '/kcsapi/api_req_battle_midnight/sp_midnight', '/kcsapi/api_req_sortie/airbattle'
      battled = true
      combined = false
      _sortieHp = body.api_nowhps.slice(1, 7)
      _enemyHp = body.api_nowhps.slice(7, 13)
      enemyShipId = body.api_ship_ke.slice(1, 7)
      if path != '/kcsapi/api_req_battle_midnight/battle'
        enemyFormation = body.api_formation[1]
      analogBattle _sortieHp, _enemyHp, _combinedHp, false, false, body
    # Event Combined battle
    when '/kcsapi/api_req_combined_battle/airbattle', '/kcsapi/api_req_combined_battle/battle', '/kcsapi/api_req_combined_battle/midnight_battle', '/kcsapi/api_req_combined_battle/sp_midnight'
      battled = true
      combined = true
      _sortieHp = body.api_nowhps.slice(1, 7)
      _combinedHp = body.api_nowhps_combined.slice(1, 7)
      _enemyHp = body.api_nowhps.slice(7, 13)
      enemyShipId = body.api_ship_ke.slice(1, 7)
      if path != '/kcsapi/api_req_combined_battle/midnight_battle'
        enemyFormation = body.api_formation[1]
      analogBattle _sortieHp, _enemyHp, _combinedHp, true, false, body
    when '/kcsapi/api_req_combined_battle/battle_water'
      battled = true
      combined = true
      _sortieHp = body.api_nowhps.slice(1, 7)
      _combinedHp = body.api_nowhps_combined.slice(1, 7)
      _enemyHp = body.api_nowhps.slice(7, 13)
      enemyShipId = body.api_ship_ke.slice(1, 7)
      enemyFormation = body.api_formation[1]
      analogBattle _sortieHp, _enemyHp, _combinedHp, true, true, body
    when '/kcsapi/api_req_sortie/battleresult', '/kcsapi/api_req_combined_battle/battleresult'
      if battled
        {_decks} = window
        event = new CustomEvent 'battle.result',
          bubbles: true
          cancelable: true
          detail:
            rank: body.api_win_rank
            boss: bossCell == currentCell or colorNo == 5
            map: map
            mapCell: currentCell
            quest: body.api_quest_name
            enemy: body.api_enemy_info.api_deck_name
            combined: combined
            mvp: if combined then [body.api_mvp - 1, body.api_mvp_combined - 1] else [body.api_mvp - 1, body.api_mvp - 1]
            dropShipId: if body.api_get_ship? then body.api_get_ship.api_ship_id else -1
            deckShipId: if combined then _decks[0].api_ship.concat(_decks[1].api_ship) else Object.clone _decks[deckId].api_ship
            deckHp: if combined then _sortieHp.concat(_combinedHp) else _sortieHp
            enemyShipId: Object.clone enemyShipId
            enemyFormation: enemyFormation
            enemyHp: Object.clone _enemyHp
            getEventItem: body.api_get_eventitem?
        window.dispatchEvent event
