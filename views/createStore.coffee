{createStore} = require 'redux'
{observer, observe} = require 'redux-observers'

{reducer: rootReducer} = require('./redux')
{updateFatigueTimer} = require('./redux/timers')

cachePosition = '_storeCache'
targetPaths = ['const', 'info']
storeCache = try
    JSON.parse(localStorage.getItem(cachePosition) || '{}')
  catch
    {}

### Utils ###

# splitPath 'foo.bar.0' -> ['foo', 'bar', '0']
# splitPath '' -> []
splitPath = (path) ->
  if typeof path == 'string'
    if !path
      []
    else
      path.split '.'
  else
    path

# deepSelect = (state, path) -> something
#   Equivalent to
#     state[path]
#   while allowing deep path (like 'foo.bar.0').
deepSelect = (state, path) ->
  path = splitPath path
  if !state?
    state = {}
  for field in path
    if !state[field]?
      state[field] = {}
    state = state[field]
  state

# deepAssign = (path) -> (state, val) -> state
#   Equivalent to
#     state[path] = val
#   while allowing deep path (like 'foo.bar.0').
#   Does NOT clone.
#   Creates a {} if undefined is found on any level (but should avoid)
#   Requires non-empty path and non-undefined state
deepAssign = (path) ->
  if !path
    throw new Error 'Argument "path" for deepAssign should not be empty '
  path = splitPath path
  lastField = path[path.length - 1]
  bodyFields = path[...-1]

  (state, val) ->
    if !state?
      throw new Error 'Argument "state" for deepAssign should not be empty '
    deepSelect(state, bodyFields)[lastField] = val
    state

autoCacheObserver = (store, path) ->
  doCache = deepAssign path
  observer(
    (state) -> deepSelect(state, path),
    (dispatch, current, previous) ->
      doCache storeCache, current
      # TODO: Here's a potential performance problem where this setItem
      # will be called multiple times if more than one targetPath
      # is modified in one action.
      localStorage.setItem cachePosition, JSON.stringify storeCache
  )


### Executing code ###

store = createStore rootReducer, storeCache
window.dispatch = store.dispatch

### Listeners and exports ###

window.getStore = (path) ->
  state = store.getState()
  return state if !path
  if typeof path == 'string'
    path = path.split(/[.(\[")("\])(\[')(\[')\[\]]/g).filter((e) => return e)
  for pathSeg in path
    if !state?
      return
    state = state[pathSeg]
  state

# When any targetPath is modified, store it into localStorage
# observe(store, [myObserver, ...myOtherObservers])
observe(store,
  targetPaths.map((path) -> autoCacheObserver(store, path))
)

module.exports.store = store
