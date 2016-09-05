// This file used to rule the world.
// Now it provides backward compatibilities of functions it used to own.
// TODO: Remove the file

import {
  buildArray,
  indexify,
  pickExisting,
  copyIfSame,
  reduxSet,
  compareUpdate,
  resolveTime,
  timeToString,
} from 'views/utils/tools'

import {
  getCondStyle,
} from 'views/utils/game-utils'

window.getCondStyle = getCondStyle
window.buildArray = buildArray
window.indexify = indexify
window.pickExisting = pickExisting
window.copyIfSame = copyIfSame
window.reduxSet = reduxSet
window.compareUpdate = compareUpdate
window.resolveTime = resolveTime
window.timeToString = timeToString

