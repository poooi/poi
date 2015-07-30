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
nowHp = []
enemyShipId = []

koukuAttack = (nowHp, kouku) ->
  if kouku.api_edam?
    for damage, i in kouku.api_edam
      damage = Math.floor(damage)
      continue if damage <= 0
      nowHp[i + 5] -= damage
  if kouku.api_fdam?
    for damage, i in kouku.api_fdam
      damage = Math.floor(damage)
      continue if damage <= 0
      nowHp[i - 1] -= damage
openAttack = (nowHp, openingAttack) ->
  if openingAttack.api_edam?
    for damage, i in openingAttack.api_edam
      damage = Math.floor(damage)
      continue if damage <= 0
      nowHp[i + 5] -= damage
  if openingAttack.api_fdam?
    for damage, i in openingAttack.api_fdam
      damage = Math.floor(damage)
      continue if damage <= 0
      nowHp[i - 1] -= damage
hougekiAttack = (nowHp, hougeki) ->
  for damageFrom, i in hougeki.api_at_list
    continue if damageFrom == -1
    for damage, j in hougeki.api_damage[i]
      damage = Math.floor(damage)
      damageTo = hougeki.api_df_list[i][j]
      continue if damage <= 0
      nowHp[damageTo - 1] -= damage
raigekiAttack = (nowHp, raigeki) ->
  if raigeki.api_edam?
    for damage, i in raigeki.api_edam
      damage = Math.floor(damage)
      continue if damage <= 0
      nowHp[i + 5] -= damage
  if raigeki.api_fdam?
    for damage, i in raigeki.api_fdam
      damage = Math.floor(damage)
      continue if damage <= 0
      nowHp[i - 1] -= damage
supportAttack = (nowHp, damages) ->
  for damage, i in damages
    damage = Math.floor(damage)
    continue if damage <= 0
    continue if i > 6
    nowHp[i + 5] -= damage

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
    when '/kcsapi/api_req_map/next'
      currentCell = body.api_no
      battled = false
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
    when '/kcsapi/api_req_sortie/battle'
      battled = true
      enemyShipId = body.api_ship_ke.slice 1, 7
      nowHp = body.api_nowhps.slice 1, 13
      koukuAttack nowHp, body.api_kouku.api_stage3 if body.api_kouku.api_stage3?
      openAttack nowHp, body.api_opening_atack if body.api_opening_atack?
      hougekiAttack nowHp, body.api_hougeki1 if body.api_hougeki1?
      hougekiAttack nowHp, body.api_hougeki2 if body.api_hougeki2?
      hougekiAttack nowHp, body.api_hougeki3 if body.api_hougeki3?
      raigekiAttack nowHp, body.api_raigeki if body.api_raigeki?
      if body.api_support_info?
        if body.api_support_info.api_support_airatack?
          supportAttack nowHp, body.api_support_info.api_support_airatack.api_stage3.api_edam
        else if body.api_support_info.api_support_hourai?
          supportAttack nowHp, body.api_support_info.api_support_hourai.api_damage
        else
          supportAttack nowHp, body.api_support_info.api_damage
    when '/kcsapi/api_req_battle_midnight/battle'
      battled = true
      hougekiAttack nowHp, body.api_hougeki if body.api_hougeki?
    when '/kcsapi/api_req_battle_midnight/sp_midnight'
      battled = true
      enemyShipId = body.api_ship_ke.slice 1, 7
      nowHp = body.api_nowhps.slice 1, 13
      hougekiAttack nowHp, body.api_hougeki if body.api_hougeki?
    when '/kcsapi/api_req_sortie/airbattle'
      battled = true
      enemyShipId = body.api_ship_ke.slice 1, 7
      nowHp = body.api_nowhps.slice 1, 13
      koukuAttack nowHp, body.api_kouku.api_stage3 if body.api_kouku? && body.api_kouku.api_stage3?
      koukuAttack nowHp, body.api_kouku2.api_stage3 if body.api_kouku2? && body.api_kouku2.api_stage3?
    when '/kcsapi/api_req_sortie/battleresult'
      if battled
        {_decks} = window
        event = new CustomEvent 'battle.result',
          bubbles: true
          cancelable: true
          detail:
            rank: body.api_win_rank
            boss: bossCell == currentCell
            map: map
            mapCell: currentCell
            quest: body.api_quest_name
            enemy: body.api_enemy_info.api_deck_name
            dropShipId: if body.api_get_ship? then body.api_get_ship.api_ship_id else -1
            deckShipId: Object.clone _decks[deckId].api_ship
            deckHp: nowHp.slice 0, 6
            enemyShipId: Object.clone enemyShipId
            enemyHp: nowHp.slice 6, 12
        window.dispatchEvent event
