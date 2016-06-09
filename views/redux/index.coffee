{combineReducers} = require 'redux'
reduceReducers = require 'reduce-reducers'

GAME_RESPONSE = 'GAME_RESPONSE'
GAME_REQUEST = 'GAME_REQUEST'

# === Utils ===

window.initAs = (initVal) -> (state, action) ->
  initVal if !state? else state

window.listenToResponse = (path, callback) -> (state, action) ->
  switch action.type
    when GAME_RESPONSE
      if (typeof(path) == 'string' && path == action.path) ||
         (typeof(path) == 'array' && path in action.path)
        result = callback(state, action)
        return result if result
  return state

window.listenToRequest = (path, callback) -> (state, action) ->
  switch action.type
    when GAME_REQUEST
      if (typeof(path) == 'string' && path == action.path) ||
         (typeof(path) == 'array' && path in action.path)
        result = callback(state, action)
        return result if result
  return state

window.indexify = (array, key='api_id') ->
  if typeof key == 'string'
    keyFunc = (element) -> element[key]
  else
    keyFunc = key
  result = []
  for element in array
    result[keyFunc(element)] = element 
  result


# === Root reducer ===

module.exports.reducer = reduceReducers(
  combineReducers(
    tick: require('./tick').reducer
    const: require('./const').reducer
    info: require('./info').reducer
  ),
)
  

# === Actions ===

module.exports.dispatchGameResponse = ({method, path, body, postBody}) -> {
  type: GAME_RESPONSE,
  method, 
  path, 
  body, 
  postBody, 
}

module.exports.dispatchGameRequest = ({method, path, body}) -> {
  type: GAME_REQUEST,
  method, 
  path, 
  body, 
}
