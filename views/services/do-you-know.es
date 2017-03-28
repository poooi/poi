const {i18n, config} = window

const __ = window.i18n.others.__.bind(i18n.others)
// const __n = window.i18n.others.__n.bind(i18n.others)
const INTERVAL = config.get('poi.doyouknow.interval', 1800)
const STICKY_TIME = 20
const PREFIX = __("doyouknow-prefix")

const update = (list) => {
  if (!config.get('poi.doyouknow.enabled', true) && list) {
    return
  }
  window.log(PREFIX + list[Math.floor(Math.random() * list.length)], {
    priority: 1,
    stickyFor: STICKY_TIME * 1000,
  })
  return setTimeout(update, INTERVAL * 1000, list)
}

const firstUpdate = () => {
  document.removeEventListener('DOMContentLoaded', firstUpdate)
  const list = []
  ;(__('doyouknow-contents') || []).forEach(text => {
    if (text) {
      list.push(text)
    }
  })
  if (list.length != 0) {
    return setTimeout(update, 1000, list)
  }
}

document.addEventListener('DOMContentLoaded', firstUpdate)
