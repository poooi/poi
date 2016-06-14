{updateTick} = require '../redux/tick'

window.setInterval (-> dispatch updateTick()), 1000
