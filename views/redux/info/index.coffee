{combineReducers} = require 'redux'
reduceReducers = require 'reduce-reducers'

module.exports.reducer = reduceReducers(
  combineReducers(
    basic: require('./basic').reducer
    ships: require('./ships').reducer
    fleets: require('./fleets').reducer
    equips: require('./equips').reducer
    repairs: require('./repairs').reducer
    constructions: require('./constructions').reducer
    #expeditions: require('./expeditions').reducer
    resources: require('./resources').reducer
    #quests: require('./quests').reducer
    maps: require('./maps').reducer
  ),
)
