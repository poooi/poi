{combineReducers} = require 'redux'
reduceReducers = require 'reduce-reducers'

GAME_RESPONSE = 'GAME_RESPONSE'
GAME_REQUEST = 'GAME_REQUEST'

# === Utils ===

window.initAs = (initVal) -> (state=initVal, action) ->
  state

window.listenToResponse = (path, callback) ->
  if typeof path == 'string'
    path = [path]
  (state, action) ->
    switch action.type
      when GAME_RESPONSE
        if action.path in path
          result = callback(state, action)
          return result if result
    return state

window.listenToRequest = (path, callback) ->
  if typeof path == 'string'
    path = [path]
  (state, action) ->
    switch action.type
      when GAME_REQUEST
        if action.path in path
          result = callback(state, action)
          return result if result
    return state

window.indexify = (array, key='api_id') ->
  if typeof key == 'string'
    keyFunc = (element) -> element[key]
  else
    keyFunc = key
  result = {}
  for element in array
    result[keyFunc(element)] = element 
  result


# === Root reducer ===

module.exports.reducer = reduceReducers(
  combineReducers(
    const: require('./const').reducer
    info: require('./info').reducer
    sortie: require('./sortie').reducer
  ),
)
  

# === Actions ===

module.exports.onGameResponse = ({method, path, body, postBody}) -> {
  type: GAME_RESPONSE,
  method, 
  path, 
  body, 
  postBody, 
}

module.exports.onGameRequest = ({method, path, body}) -> {
  type: GAME_REQUEST,
  method, 
  path, 
  body, 
}
