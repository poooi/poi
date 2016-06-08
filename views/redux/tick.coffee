UPDATE_TICK = 'UPDATE_TICK'

module.exports.reducer = (state=Date.now(), action) -> 
  switch action.type
    when UPDATE_TICK
      return Date.now()
  state

module.exports.updateTick = () -> 
  type: UPDATE_TICK
  
