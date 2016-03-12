{remoteStringify} = remote.require './lib/utils'

Object.clone = (obj) ->
  JSON.parse JSON.stringify obj
Object.remoteClone = (obj) ->
  JSON.parse remoteStringify obj

pad = (n) ->
  if n < 10 then "0#{n}" else n
window.resolveTime = (seconds) ->
  seconds = parseInt seconds
  if seconds >= 0
    s = seconds % 60
    m = Math.trunc(seconds / 60) % 60
    h = Math.trunc(seconds / 3600)
    "#{pad h}:#{pad m}:#{pad s}"
  else
    ''
window.timeToString = (milliseconds) ->
  date = new Date(milliseconds)
  date.toTimeString().slice(0, 8)  # HH:mm:ss

# Not sure where this function should go, leave it here just for now, for easy access.
window.getCondStyle = (cond) ->
  s = 'poi-ship-cond-'
  if cond > 52
    s += '53'
  else if cond > 49
    s += '50'
  else if cond == 49
    s += '49'
  else if cond > 39
    s += '40'
  else if cond > 29
    s += '30'
  else if cond > 19
    s += '20'
  else
    s += '0'
  s += if isDarkTheme then ' dark' else ' light'
