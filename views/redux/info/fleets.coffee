reduceReducers = require 'reduce-reducers'

mergeIndexifiedFleets = (state, body) -> 
  Object.assign [], state, indexify(body, (deck) -> (deck.api_id - 1))

# Clone the array, remove a ship from it and add -1 to the tail.
removeShip = (ships, i) ->
  ships = ships.slice()
  ships.splice(i, 1)
  ships.concat(-1)

module.exports.reducer = reduceReducers(
  initAs([])
  ,
  listenToResponse('/kcsapi/api_port/port',
    (state, {body}) -> body.api_deck_port
  ),
  listenToResponse('/kcsapi/api_get_member/deck', 
    (state, {body}) -> mergeIndexifiedFleets state, body
  ),
  listenToResponse('/kcsapi/api_req_kaisou/powerup',
    (state, {body}) -> mergeIndexifiedFleets state, body.api_deck
  ),
  listenToResponse([
      '/kcsapi/api_get_member/ship_deck', 
      '/kcsapi/api_get_member/ship3', 
    ], (state, {body}) -> mergeIndexifiedFleets state, body.api_deck_data
  ),
  listenToResponse('/kcsapi/api_req_hensei/preset_select',
    (state, {postBody: {api_deck_id}, body}) ->
      decks = state.slice()
      decks[parseInt(api_deck_id) - 1] = body
      decks
  ),
  listenToResponse('/kcsapi/api_req_kousyou/destroyship',
    (state, {postBody: {api_deck_id, api_ship_id}, body}) ->
      decks = state
      removeId = parseInt(api_ship_id)
      for deck, i in decks
        for shipId, j in deck.api_ship
          if shipId == removeId
            decks = decks.slice()
            decks[i] = Object.assign {}, deck,
              api_ship: removeShip deck.api_ship, j
            return decks
      state
  ),
  listenToResponse('/kcsapi/api_req_hensei/change', (state, {postBody, body}) -> 
    decks = state.slice()
    deckId = parseInt(postBody.api_id) - 1
    idx = parseInt(postBody.api_ship_idx)
    curId = decks[deckId].api_ship[idx]
    shipId = parseInt(postBody.api_ship_id)
    # Remove all
    if idx == -1
      decks[deckId].api_ship[i] = -1 for i in [1..5]
    # Empty -> One
    else if curId == -1
      [x, y] = [-1, -1]
      for deck, i in decks
        for ship, j in deck.api_ship
          if ship == shipId
            [x, y] = [i, j]
            break
      decks[deckId].api_ship[idx] = shipId
      # Empty to ship in deck
      if x != -1 && y != -1
        if y <= 4
          for i in [y..4]
            decks[x].api_ship[i] = decks[x].api_ship[i + 1]
        decks[x].api_ship[5] = -1
    # One -> Empty
    else if shipId == -1
      if idx <= 4
        for i in [idx..4]
          decks[deckId].api_ship[i] = decks[deckId].api_ship[i + 1]
      decks[deckId].api_ship[5] = -1
    else
      [x, y] = [-1, -1]
      for deck, i in decks
        for ship, j in deck.api_ship
          if ship == shipId
            [x, y] = [i, j]
            break
      decks[deckId].api_ship[idx] = shipId
      # Exchange
      decks[x].api_ship[y] = curId if x != -1 && y != -1
    decks
  ),
)
