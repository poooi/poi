{combineReducers} = require 'redux'
reduceReducers = require 'reduce-reducers'

module.exports.reducer = reduceReducers(
  combineReducers(
    basic: require('./basic').reducer
    ships: require('./ships').reducer
    fleets: require('./fleets').reducer
    equips: require('./equips').reducer
    repair: require('./repair').reducer
    construction: require('./construction').reducer
    #expedition: require('./expedition').reducer
    resources: require('./resources').reducer
    #quests: require('./quests').reducer
    mapinfo: require('./mapinfo').reducer
  ),
)
