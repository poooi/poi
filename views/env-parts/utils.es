
Object.clone = (obj) =>
  JSON.parse(JSON.stringify(obj))
Object.remoteClone = (obj) =>
  JSON.parse(window.remote.require('./lib/utils').remoteStringify(obj))

function pad(n) {
  return n < 10 ? `0${n}` : n
}
window.resolveTime = (seconds) => {
  seconds = parseInt(seconds)
  if (seconds >= 0) {
    const s = seconds % 60
    const m = Math.trunc(seconds / 60) % 60
    const h = Math.trunc(seconds / 3600)
    return `${pad(h)}:${pad(m)}:${pad(s)}`
  } else {
    return ''
  }
}
window.timeToString = (milliseconds) => {
  const date = new Date(milliseconds)
  return date.toTimeString().slice(0, 8)  // HH:mm:ss
}

// Input: [[index, value], ...]
// Return: Array
window.buildArray = (pairs) => {
  const ret = []
  pairs.forEach(([index, value]=[]) => {
    index = parseInt(index)
    if (isNaN(index) || index < 0)
      return
    ret[index] = value
  })
  return ret
}

// Not sure where this function should go, leave it here just for now, for easy access.
window.getCondStyle = (cond) => {
  let s = 'poi-ship-cond-'
  if (cond > 52)
    s += '53'
  else if (cond > 49)
    s += '50'
  else if (cond == 49)
    s += '49'
  else if (cond > 39)
    s += '40'
  else if (cond > 29)
    s += '30'
  else if (cond > 19)
    s += '20'
  else
    s += '0'
  s += window.isDarkTheme ? ' dark' : ' light'
  return s
}

window.pickId = (collection={}, keys) => {
  const res = {}
  keys.forEach((key) => {
    res[key] = collection[key]
  })
  return res
}
